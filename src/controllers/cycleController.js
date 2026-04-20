'use strict';

const db = require('../models');
const { Cycle, Truck, Operator } = db;
const { Op } = require('sequelize');
const businessConfig = require('../config/businessConfig');
const { randomBytes } = require('crypto');
const cache = require('../utils/memoryCache');

/**
 * Cycle Controller - Handles cycle operations with intelligence and completeness
 * Part of "consciousness and absoluteness" integration
 */

// Helper function to generate cycle ID
function generateCycleId() {
  const uuid = randomBytes(4).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return 'CYC-' + timestamp + '-' + uuid;
}

// Helper function to calculate earnings based on duration
// Formula: Base rate per hour + efficiency bonus
function calculateEarnings(durationMinutes) {
  const { BASE_RATE_PER_HOUR, EFFICIENCY_BONUS_THRESHOLD_MINUTES, EFFICIENCY_BONUS_AMOUNT } = businessConfig.earnings;
  
  const hours = durationMinutes / 60;
  let earnings = BASE_RATE_PER_HOUR * hours;
  
  // Add efficiency bonus for fast completion
  if (durationMinutes < EFFICIENCY_BONUS_THRESHOLD_MINUTES) {
    earnings += EFFICIENCY_BONUS_AMOUNT;
  }
  
  return Math.round(earnings * 100) / 100; // Round to 2 decimals
}

/**
 * Create a new cycle
 * POST /api/cycles
 */
exports.createCycle = async (req, res) => {
  const { truck_id, operator_id, start_location } = req.body;
  
  try {
    const newCycle = await db.sequelize.transaction(async (transaction) => {
      const [truck, operator] = await Promise.all([
        Truck.findByPk(truck_id, { transaction, lock: transaction.LOCK.UPDATE }),
        Operator.findByPk(operator_id, { transaction, lock: transaction.LOCK.UPDATE })
      ]);

      if (!truck) {
        return { status: 404, body: { success: false, error: `Truck ${truck_id} not found` } };
      }

      if (truck.status === 'maintenance') {
        return {
          status: 400,
          body: {
            success: false,
            error: `Truck ${truck_id} is in maintenance and cannot start a cycle`
          }
        };
      }

      if (!operator) {
        return { status: 404, body: { success: false, error: `Operator ${operator_id} not found` } };
      }

      if (operator.status === 'resting') {
        return {
          status: 400,
          body: {
            success: false,
            error: `Operator ${operator.code} is resting and cannot start a cycle`
          }
        };
      }

      const existingCycle = await Cycle.findOne({
        where: {
          status: 'in_progress',
          [Op.or]: [
            { truck_id },
            { operator_id }
          ]
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existingCycle) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Truck or operator already has an active cycle'
          }
        };
      }

      const now = new Date();
      const cycle = await Cycle.create({
        id: generateCycleId(),
        truck_id,
        operator_id,
        start_time: now,
        start_location: start_location || truck.location,
        status: 'in_progress'
      }, { transaction });

      await Promise.all([
        truck.update({
          status: 'active',
          current_operator_id: operator_id,
          cycle_start_time: now
        }, { transaction }),
        operator.update({
          status: 'working',
          current_truck_id: truck_id,
          shift_start: operator.shift_start || now
        }, { transaction })
      ]);

      return {
        status: 201,
        body: {
          success: true,
          message: 'Cycle created successfully',
          cycle: {
            id: cycle.id,
            truck_id: cycle.truck_id,
            operator_id: cycle.operator_id,
            start_time: cycle.start_time,
            start_location: cycle.start_location,
            status: cycle.status
          }
        }
      };
    });

    if (newCycle.status !== 201) {
      return res.status(newCycle.status).json(newCycle.body);
    }

    cache.invalidate('analytics:');
    
    res.status(201).json(newCycle.body);
  } catch (error) {
    console.error('Error creating cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Complete a cycle
 * POST /api/cycles/:id/complete
 */
exports.completeCycle = async (req, res) => {
  const { id } = req.params;
  const { end_location } = req.body;
  
  try {
    const result = await db.sequelize.transaction(async (transaction) => {
      const cycle = await Cycle.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!cycle) {
        return {
          status: 404,
          body: {
            success: false,
            error: `Cycle ${id} not found`
          }
        };
      }

      if (cycle.status !== 'in_progress') {
        return {
          status: 400,
          body: {
            success: false,
            error: `Cycle ${id} is already ${cycle.status}`
          }
        };
      }

      const [truck, operator] = await Promise.all([
        Truck.findByPk(cycle.truck_id, { transaction, lock: transaction.LOCK.UPDATE }),
        Operator.findByPk(cycle.operator_id, { transaction, lock: transaction.LOCK.UPDATE })
      ]);

      const endTime = new Date();
      const durationMs = endTime - new Date(cycle.start_time);
      const durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));
      const earnings = calculateEarnings(durationMinutes);
      const operatorHours = Number(operator.total_hours) + (durationMinutes / 60);
      const operatorTotalEarnings = Number(operator.total_earnings) + earnings;
      const operatorTotalCycles = Number(operator.total_cycles) + 1;
      const truckTotalCycles = Number(truck.total_cycles) + 1;

      await Promise.all([
        cycle.update({
          end_time: endTime,
          end_location: end_location || truck.location,
          duration_minutes: durationMinutes,
          earnings,
          status: 'completed'
        }, { transaction }),
        truck.update({
          status: 'resting',
          current_operator_id: null,
          cycle_start_time: null,
          total_cycles: truckTotalCycles
        }, { transaction }),
        operator.update({
          status: 'available',
          current_truck_id: null,
          total_hours: operatorHours,
          total_cycles: operatorTotalCycles,
          total_earnings: operatorTotalEarnings
        }, { transaction })
      ]);

      return {
        status: 200,
        body: {
          success: true,
          message: 'Cycle completed successfully',
          cycle: {
            id: cycle.id,
            truck_id: cycle.truck_id,
            operator_id: cycle.operator_id,
            start_time: cycle.start_time,
            end_time: endTime,
            duration_minutes: durationMinutes,
            earnings,
            status: 'completed'
          },
          stats: {
            operator_total_cycles: operatorTotalCycles,
            operator_total_earnings: operatorTotalEarnings,
            truck_total_cycles: truckTotalCycles
          }
        }
      };
    });

    if (result.status !== 200) {
      return res.status(result.status).json(result.body);
    }

    cache.invalidate('analytics:');

    res.json(result.body);
  } catch (error) {
    console.error('Error completing cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update cycle location (for real-time tracking)
 * PATCH /api/cycles/:id/location
 */
exports.updateLocation = async (req, res) => {
  const { id } = req.params;
  const { location } = req.body;
  
  if (!location) {
    return res.status(400).json({
      success: false,
      error: 'Location is required'
    });
  }
  
  try {
    const cycle = await Cycle.findByPk(id, {
      include: [{ model: Truck, as: 'truck' }]
    });
    
    if (!cycle) {
      return res.status(404).json({
        success: false,
        error: `Cycle ${id} not found`
      });
    }
    
    if (cycle.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: 'Can only update location for in-progress cycles'
      });
    }
    
    // Update truck location
    await cycle.truck.update({ location });

    cache.invalidate('analytics:');
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      cycle: {
        id: cycle.id,
        truck_id: cycle.truck_id,
        location: location,
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all cycles with filters
 * GET /api/cycles
 */
exports.getCycles = async (req, res) => {
  const { status, truck_id, operator_id, limit } = req.query;
  
  try {
    const where = {};
    const defaultLimit = businessConfig.pagination.DEFAULT_LIMIT || 50;
    const maxLimit = businessConfig.pagination.MAX_LIMIT || 100;
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || defaultLimit, 1), maxLimit);
    if (status) where.status = status;
    if (truck_id) where.truck_id = truck_id;
    if (operator_id) where.operator_id = parseInt(operator_id);
    
    const cycles = await Cycle.findAll({
      where,
      include: [
        { model: Truck, as: 'truck', attributes: ['id', 'plate', 'location'] },
        { model: Operator, as: 'operator', attributes: ['id', 'code', 'name'] }
      ],
      order: [['start_time', 'DESC']],
      limit: safeLimit
    });
    
    res.json({
      success: true,
      cycles: cycles.map(c => ({
        id: c.id,
        truck: { id: c.truck.id, plate: c.truck.plate, location: c.truck.location },
        operator: { id: c.operator.id, code: c.operator.code, name: c.operator.name },
        start_time: c.start_time,
        end_time: c.end_time,
        duration_minutes: c.duration_minutes,
        earnings: c.earnings,
        status: c.status,
        start_location: c.start_location,
        end_location: c.end_location
      })),
      total: cycles.length
    });
  } catch (error) {
    console.error('Error fetching cycles:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single cycle details
 * GET /api/cycles/:id
 */
exports.getCycle = async (req, res) => {
  const { id } = req.params;
  
  try {
    const cycle = await Cycle.findByPk(id, {
      include: [
        { model: Truck, as: 'truck' },
        { model: Operator, as: 'operator' }
      ]
    });
    
    if (!cycle) {
      return res.status(404).json({
        success: false,
        error: `Cycle ${id} not found`
      });
    }
    
    res.json({
      success: true,
      cycle: {
        id: cycle.id,
        truck: cycle.truck,
        operator: cycle.operator,
        start_time: cycle.start_time,
        end_time: cycle.end_time,
        duration_minutes: cycle.duration_minutes,
        earnings: cycle.earnings,
        status: cycle.status,
        start_location: cycle.start_location,
        end_location: cycle.end_location
      }
    });
  } catch (error) {
    console.error('Error fetching cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
