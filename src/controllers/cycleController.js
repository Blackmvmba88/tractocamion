'use strict';

const db = require('../models');
const { Cycle, Truck, Operator } = db;
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const businessConfig = require('../config/businessConfig');

/**
 * Cycle Controller - Handles cycle operations with intelligence and completeness
 * Part of "consciousness and absoluteness" integration
 */

// Helper function to generate cycle ID
function generateCycleId() {
  const uuid = uuidv4().split('-')[0].toUpperCase();
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
    // Validate truck exists and is available
    const truck = await Truck.findByPk(truck_id);
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: `Truck ${truck_id} not found`
      });
    }
    
    if (truck.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        error: `Truck ${truck_id} is in maintenance and cannot start a cycle`
      });
    }
    
    // Validate operator exists and is available
    const operator = await Operator.findByPk(operator_id);
    if (!operator) {
      return res.status(404).json({
        success: false,
        error: `Operator ${operator_id} not found`
      });
    }
    
    if (operator.status === 'resting') {
      return res.status(400).json({
        success: false,
        error: `Operator ${operator.code} is resting and cannot start a cycle`
      });
    }
    
    // Check if operator or truck already have an active cycle
    const existingCycle = await Cycle.findOne({
      where: {
        [Op.or]: [
          { truck_id, status: 'in_progress' },
          { operator_id, status: 'in_progress' }
        ]
      }
    });
    
    if (existingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Truck or operator already has an active cycle'
      });
    }
    
    // Create the cycle
    const newCycle = await Cycle.create({
      id: generateCycleId(),
      truck_id,
      operator_id,
      start_time: new Date(),
      start_location: start_location || truck.location,
      status: 'in_progress'
    });
    
    // Update truck and operator status
    await truck.update({
      status: 'active',
      current_operator_id: operator_id,
      cycle_start_time: new Date()
    });
    
    await operator.update({
      status: 'working',
      current_truck_id: truck_id,
      shift_start: operator.shift_start || new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Cycle created successfully',
      cycle: {
        id: newCycle.id,
        truck_id: newCycle.truck_id,
        operator_id: newCycle.operator_id,
        start_time: newCycle.start_time,
        start_location: newCycle.start_location,
        status: newCycle.status
      }
    });
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
    
    if (cycle.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: `Cycle ${id} is already ${cycle.status}`
      });
    }
    
    // Calculate duration and earnings
    const endTime = new Date();
    const durationMs = endTime - new Date(cycle.start_time);
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const earnings = calculateEarnings(durationMinutes);
    
    // Update cycle
    await cycle.update({
      end_time: endTime,
      end_location: end_location || cycle.truck.location,
      duration_minutes: durationMinutes,
      earnings: earnings,
      status: 'completed'
    });
    
    // Update truck status
    await cycle.truck.update({
      status: 'resting',
      current_operator_id: null,
      cycle_start_time: null,
      total_cycles: cycle.truck.total_cycles + 1
    });
    
    // Update operator stats
    const operatorHours = cycle.operator.total_hours + (durationMinutes / 60);
    await cycle.operator.update({
      status: 'available',
      current_truck_id: null,
      total_hours: operatorHours,
      total_cycles: cycle.operator.total_cycles + 1,
      total_earnings: cycle.operator.total_earnings + earnings
    });
    
    res.json({
      success: true,
      message: 'Cycle completed successfully',
      cycle: {
        id: cycle.id,
        truck_id: cycle.truck_id,
        operator_id: cycle.operator_id,
        start_time: cycle.start_time,
        end_time: cycle.end_time,
        duration_minutes: durationMinutes,
        earnings: earnings,
        status: 'completed'
      },
      stats: {
        operator_total_cycles: cycle.operator.total_cycles + 1,
        operator_total_earnings: cycle.operator.total_earnings + earnings,
        truck_total_cycles: cycle.truck.total_cycles + 1
      }
    });
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
  const { status, truck_id, operator_id, limit = 50 } = req.query;
  
  try {
    const where = {};
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
      limit: parseInt(limit)
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
