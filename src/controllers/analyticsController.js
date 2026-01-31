'use strict';

const db = require('../models');
const { Cycle, Truck, Operator } = db;
const { Op } = require('sequelize');
const sequelize = db.sequelize;

/**
 * Analytics Controller - Provides intelligent insights and metrics
 * Part of "consciousness" integration - making the system aware and intelligent
 */

/**
 * Get dashboard analytics
 * GET /api/analytics/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    // Get current status counts
    const [truckStats, operatorStats, cycleStats] = await Promise.all([
      Truck.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      }),
      Operator.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      }),
      Cycle.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      })
    ]);
    
    // Calculate totals
    const totalTrucks = await Truck.count();
    const totalOperators = await Operator.count();
    const totalCycles = await Cycle.count();
    
    // Get today's performance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCycles = await Cycle.findAll({
      where: {
        start_time: {
          [Op.gte]: today
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration'],
        [sequelize.fn('SUM', sequelize.col('earnings')), 'total_earnings']
      ]
    });
    
    // Get average cycle time
    const avgCycleTime = await Cycle.findOne({
      where: {
        status: 'completed',
        duration_minutes: { [Op.not]: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg']
      ]
    });
    
    // Calculate efficiency score (percentage of cycles under 60 minutes)
    const totalCompleted = await Cycle.count({
      where: { status: 'completed', duration_minutes: { [Op.not]: null } }
    });
    
    const fastCycles = await Cycle.count({
      where: {
        status: 'completed',
        duration_minutes: { [Op.lt]: 60 }
      }
    });
    
    const efficiencyScore = totalCompleted > 0 
      ? Math.round((fastCycles / totalCompleted) * 100) 
      : 0;
    
    // Format truck stats
    const trucks = {
      total: totalTrucks,
      active: 0,
      resting: 0,
      maintenance: 0
    };
    truckStats.forEach(stat => {
      trucks[stat.status] = parseInt(stat.get('count'));
    });
    
    // Format operator stats
    const operators = {
      total: totalOperators,
      working: 0,
      resting: 0,
      available: 0,
      offline: 0
    };
    operatorStats.forEach(stat => {
      operators[stat.status] = parseInt(stat.get('count'));
    });
    
    // Format cycle stats
    const cycles = {
      total: totalCycles,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };
    cycleStats.forEach(stat => {
      cycles[stat.status] = parseInt(stat.get('count'));
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        trucks,
        operators,
        cycles
      },
      today: {
        cycles_count: todayCycles[0] ? parseInt(todayCycles[0].get('count')) : 0,
        avg_duration_minutes: todayCycles[0] && todayCycles[0].get('avg_duration') 
          ? Math.round(todayCycles[0].get('avg_duration')) 
          : 0,
        total_earnings: todayCycles[0] && todayCycles[0].get('total_earnings')
          ? parseFloat(todayCycles[0].get('total_earnings'))
          : 0
      },
      performance: {
        avg_cycle_time_minutes: avgCycleTime && avgCycleTime.get('avg')
          ? Math.round(avgCycleTime.get('avg'))
          : 0,
        efficiency_score: efficiencyScore,
        target_time_minutes: 55 // From README.md - target is 55 min
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get operator performance metrics
 * GET /api/analytics/operators
 */
exports.getOperatorMetrics = async (req, res) => {
  try {
    const operators = await Operator.findAll({
      attributes: [
        'id',
        'code',
        'name',
        'status',
        'total_hours',
        'total_cycles',
        'total_earnings'
      ],
      order: [['total_cycles', 'DESC']]
    });
    
    // Calculate performance metrics for each operator
    const metrics = await Promise.all(operators.map(async (op) => {
      const completedCycles = await Cycle.findAll({
        where: {
          operator_id: op.id,
          status: 'completed',
          duration_minutes: { [Op.not]: null }
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration'],
          [sequelize.fn('MIN', sequelize.col('duration_minutes')), 'best_time']
        ]
      });
      
      const avgDuration = completedCycles[0] && completedCycles[0].get('avg_duration')
        ? Math.round(completedCycles[0].get('avg_duration'))
        : 0;
      
      const bestTime = completedCycles[0] && completedCycles[0].get('best_time')
        ? Math.round(completedCycles[0].get('best_time'))
        : 0;
      
      return {
        operator: {
          id: op.id,
          code: op.code,
          name: op.name,
          status: op.status
        },
        stats: {
          total_cycles: op.total_cycles,
          total_hours: parseFloat(op.total_hours),
          total_earnings: parseFloat(op.total_earnings),
          avg_cycle_time: avgDuration,
          best_cycle_time: bestTime,
          avg_earnings_per_cycle: op.total_cycles > 0 
            ? Math.round((op.total_earnings / op.total_cycles) * 100) / 100
            : 0
        }
      };
    }));
    
    res.json({
      success: true,
      operators: metrics,
      total: metrics.length
    });
  } catch (error) {
    console.error('Error fetching operator metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get truck utilization metrics
 * GET /api/analytics/trucks
 */
exports.getTruckMetrics = async (req, res) => {
  try {
    const trucks = await Truck.findAll({
      attributes: ['id', 'plate', 'status', 'total_cycles']
    });
    
    const metrics = await Promise.all(trucks.map(async (truck) => {
      const cycles = await Cycle.findAll({
        where: {
          truck_id: truck.id,
          status: 'completed',
          duration_minutes: { [Op.not]: null }
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration'],
          [sequelize.fn('SUM', sequelize.col('earnings')), 'total_revenue']
        ]
      });
      
      const avgDuration = cycles[0] && cycles[0].get('avg_duration')
        ? Math.round(cycles[0].get('avg_duration'))
        : 0;
      
      const totalRevenue = cycles[0] && cycles[0].get('total_revenue')
        ? parseFloat(cycles[0].get('total_revenue'))
        : 0;
      
      return {
        truck: {
          id: truck.id,
          plate: truck.plate,
          status: truck.status
        },
        stats: {
          total_cycles: truck.total_cycles,
          avg_cycle_time: avgDuration,
          total_revenue: totalRevenue,
          revenue_per_cycle: truck.total_cycles > 0
            ? Math.round((totalRevenue / truck.total_cycles) * 100) / 100
            : 0
        }
      };
    }));
    
    res.json({
      success: true,
      trucks: metrics,
      total: metrics.length
    });
  } catch (error) {
    console.error('Error fetching truck metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get alerts and anomalies (consciousness feature)
 * GET /api/analytics/alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    const alerts = [];
    
    // Check for operators working too long without rest
    const longWorkingOperators = await Operator.findAll({
      where: {
        status: 'working',
        shift_start: {
          [Op.lt]: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
        }
      }
    });
    
    longWorkingOperators.forEach(op => {
      alerts.push({
        type: 'fatigue_risk',
        severity: 'high',
        entity: 'operator',
        entity_id: op.code,
        message: `Operator ${op.code} (${op.name}) has been working for over 8 hours`,
        recommendation: 'Assign operator to rest period',
        timestamp: new Date().toISOString()
      });
    });
    
    // Check for cycles taking too long
    const longCycles = await Cycle.findAll({
      where: {
        status: 'in_progress',
        start_time: {
          [Op.lt]: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        }
      },
      include: [
        { model: Truck, as: 'truck', attributes: ['id', 'plate'] },
        { model: Operator, as: 'operator', attributes: ['code', 'name'] }
      ]
    });
    
    longCycles.forEach(cycle => {
      const durationMinutes = Math.round((Date.now() - new Date(cycle.start_time)) / (1000 * 60));
      alerts.push({
        type: 'delayed_cycle',
        severity: 'medium',
        entity: 'cycle',
        entity_id: cycle.id,
        message: `Cycle ${cycle.id} has been running for ${durationMinutes} minutes`,
        details: {
          truck: cycle.truck.plate,
          operator: cycle.operator.code,
          duration_minutes: durationMinutes
        },
        recommendation: 'Check for delays or issues',
        timestamp: new Date().toISOString()
      });
    });
    
    // Check for trucks in maintenance
    const maintenanceTrucks = await Truck.findAll({
      where: { status: 'maintenance' }
    });
    
    maintenanceTrucks.forEach(truck => {
      alerts.push({
        type: 'maintenance',
        severity: 'low',
        entity: 'truck',
        entity_id: truck.id,
        message: `Truck ${truck.plate} is in maintenance`,
        recommendation: 'Capacity reduced',
        timestamp: new Date().toISOString()
      });
    });
    
    // Check for operators resting too long (possible issue)
    const longRestingOperators = await Operator.findAll({
      where: {
        status: 'resting',
        updatedAt: {
          [Op.lt]: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      }
    });
    
    longRestingOperators.forEach(op => {
      alerts.push({
        type: 'extended_rest',
        severity: 'low',
        entity: 'operator',
        entity_id: op.code,
        message: `Operator ${op.code} has been resting for over 4 hours`,
        recommendation: 'Check operator availability',
        timestamp: new Date().toISOString()
      });
    });
    
    res.json({
      success: true,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      total: alerts.length,
      by_severity: {
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
