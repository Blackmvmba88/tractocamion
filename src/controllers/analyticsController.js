'use strict';

const db = require('../models');
const { Cycle, Truck, Operator } = db;
const { Op } = require('sequelize');
const sequelize = db.sequelize;
const businessConfig = require('../config/businessConfig');
const cache = require('../utils/memoryCache');

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
    const payload = await cache.wrap('analytics:dashboard', 15000, async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetMinutes = businessConfig.performance.TARGET_CYCLE_TIME_MINUTES || 60;

      const [truckStats, operatorStats, cycleStats, todayCycles, completedStats] = await Promise.all([
        Truck.findAll({
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        }),
        Operator.findAll({
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        }),
        Cycle.findAll({
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        }),
        Cycle.findOne({
          where: {
            start_time: {
              [Op.gte]: today
            }
          },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration'],
            [sequelize.fn('SUM', sequelize.col('earnings')), 'total_earnings']
          ],
          raw: true
        }),
        Cycle.findOne({
          where: {
            status: 'completed',
            duration_minutes: { [Op.not]: null }
          },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'completed_count'],
            [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration'],
            [
              sequelize.fn(
                'SUM',
                sequelize.literal(`CASE WHEN "duration_minutes" < ${targetMinutes} THEN 1 ELSE 0 END`)
              ),
              'fast_count'
            ]
          ],
          raw: true
        })
      ]);

      const trucks = {
        total: 0,
        active: 0,
        resting: 0,
        maintenance: 0
      };
      truckStats.forEach(stat => {
        const count = parseInt(stat.count, 10) || 0;
        trucks.total += count;
        trucks[stat.status] = count;
      });

      const operators = {
        total: 0,
        working: 0,
        resting: 0,
        available: 0,
        offline: 0
      };
      operatorStats.forEach(stat => {
        const count = parseInt(stat.count, 10) || 0;
        operators.total += count;
        operators[stat.status] = count;
      });

      const cycles = {
        total: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };
      cycleStats.forEach(stat => {
        const count = parseInt(stat.count, 10) || 0;
        cycles.total += count;
        cycles[stat.status] = count;
      });

      const completedCount = parseInt(completedStats?.completed_count, 10) || 0;
      const fastCount = parseInt(completedStats?.fast_count, 10) || 0;
      const efficiencyScore = completedCount > 0
        ? Math.round((fastCount / completedCount) * 100)
        : 0;

      return {
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          trucks,
          operators,
          cycles
        },
        today: {
          cycles_count: parseInt(todayCycles?.count, 10) || 0,
          avg_duration_minutes: todayCycles?.avg_duration
            ? Math.round(Number(todayCycles.avg_duration))
            : 0,
          total_earnings: todayCycles?.total_earnings
            ? Number(todayCycles.total_earnings)
            : 0
        },
        performance: {
          avg_cycle_time_minutes: completedStats?.avg_duration
            ? Math.round(Number(completedStats.avg_duration))
            : 0,
          efficiency_score: efficiencyScore,
          target_time_minutes: targetMinutes
        }
      };
    });

    res.json(payload);
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
    const payload = await cache.wrap('analytics:operators', 20000, async () => {
      const [operators, cycleStats] = await Promise.all([
        Operator.findAll({
          attributes: [
            'id',
            'code',
            'name',
            'status',
            'total_hours',
            'total_cycles',
            'total_earnings'
          ],
          order: [['total_cycles', 'DESC']],
          raw: true
        }),
        Cycle.findAll({
          where: {
            status: 'completed',
            duration_minutes: { [Op.not]: null }
          },
          attributes: [
            'operator_id',
            [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration'],
            [sequelize.fn('MIN', sequelize.col('duration_minutes')), 'best_time']
          ],
          group: ['operator_id'],
          raw: true
        })
      ]);

      const statsByOperatorId = new Map(
        cycleStats.map((stat) => [stat.operator_id, stat])
      );

      const metrics = operators.map((op) => {
        const aggregate = statsByOperatorId.get(op.id);
        const totalCycles = Number(op.total_cycles) || 0;
        const totalEarnings = Number(op.total_earnings) || 0;

        return {
          operator: {
            id: op.id,
            code: op.code,
            name: op.name,
            status: op.status
          },
          stats: {
            total_cycles: totalCycles,
            total_hours: Number(op.total_hours) || 0,
            total_earnings: totalEarnings,
            avg_cycle_time: aggregate?.avg_duration ? Math.round(Number(aggregate.avg_duration)) : 0,
            best_cycle_time: aggregate?.best_time ? Math.round(Number(aggregate.best_time)) : 0,
            avg_earnings_per_cycle: totalCycles > 0
              ? Math.round((totalEarnings / totalCycles) * 100) / 100
              : 0
          }
        };
      });

      return {
        success: true,
        operators: metrics,
        total: metrics.length
      };
    });

    res.json(payload);
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
    const payload = await cache.wrap('analytics:trucks', 20000, async () => {
      const [trucks, cycleStats] = await Promise.all([
        Truck.findAll({
          attributes: ['id', 'plate', 'status', 'total_cycles'],
          raw: true
        }),
        Cycle.findAll({
          where: {
            status: 'completed',
            duration_minutes: { [Op.not]: null }
          },
          attributes: [
            'truck_id',
            [sequelize.fn('AVG', sequelize.col('duration_minutes')), 'avg_duration'],
            [sequelize.fn('SUM', sequelize.col('earnings')), 'total_revenue']
          ],
          group: ['truck_id'],
          raw: true
        })
      ]);

      const statsByTruckId = new Map(
        cycleStats.map((stat) => [stat.truck_id, stat])
      );

      const metrics = trucks.map((truck) => {
        const aggregate = statsByTruckId.get(truck.id);
        const totalCycles = Number(truck.total_cycles) || 0;
        const totalRevenue = aggregate?.total_revenue ? Number(aggregate.total_revenue) : 0;

        return {
          truck: {
            id: truck.id,
            plate: truck.plate,
            status: truck.status
          },
          stats: {
            total_cycles: totalCycles,
            avg_cycle_time: aggregate?.avg_duration ? Math.round(Number(aggregate.avg_duration)) : 0,
            total_revenue: totalRevenue,
            revenue_per_cycle: totalCycles > 0
              ? Math.round((totalRevenue / totalCycles) * 100) / 100
              : 0
          }
        };
      });

      return {
        success: true,
        trucks: metrics,
        total: metrics.length
      };
    });

    res.json(payload);
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
    const payload = await cache.wrap('analytics:alerts', 15000, async () => {
      const alerts = [];
      const now = Date.now();
      const { FATIGUE_THRESHOLD_HOURS, DELAYED_CYCLE_THRESHOLD_HOURS, EXTENDED_REST_THRESHOLD_HOURS } = businessConfig.alerts;

      const [longWorkingOperators, longCycles, maintenanceTrucks, longRestingOperators] = await Promise.all([
        Operator.findAll({
          where: {
            status: 'working',
            shift_start: {
              [Op.lt]: new Date(now - FATIGUE_THRESHOLD_HOURS * 60 * 60 * 1000)
            }
          }
        }),
        Cycle.findAll({
          where: {
            status: 'in_progress',
            start_time: {
              [Op.lt]: new Date(now - DELAYED_CYCLE_THRESHOLD_HOURS * 60 * 60 * 1000)
            }
          },
          include: [
            { model: Truck, as: 'truck', attributes: ['id', 'plate'] },
            { model: Operator, as: 'operator', attributes: ['code', 'name'] }
          ]
        }),
        Truck.findAll({
          where: { status: 'maintenance' }
        }),
        Operator.findAll({
          where: {
            status: 'resting',
            updatedAt: {
              [Op.lt]: new Date(now - EXTENDED_REST_THRESHOLD_HOURS * 60 * 60 * 1000)
            }
          }
        })
      ]);

      longWorkingOperators.forEach(op => {
        alerts.push({
          type: 'fatigue_risk',
          severity: 'high',
          entity: 'operator',
          entity_id: op.code,
          message: `Operator ${op.code} (${op.name}) has been working for over ${FATIGUE_THRESHOLD_HOURS} hours`,
          recommendation: 'Assign operator to rest period',
          timestamp: new Date().toISOString()
        });
      });

      longCycles.forEach(cycle => {
        const durationMinutes = Math.round((now - new Date(cycle.start_time)) / (1000 * 60));
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

      longRestingOperators.forEach(op => {
        alerts.push({
          type: 'extended_rest',
          severity: 'low',
          entity: 'operator',
          entity_id: op.code,
          message: `Operator ${op.code} has been resting for over ${EXTENDED_REST_THRESHOLD_HOURS} hours`,
          recommendation: 'Check operator availability',
          timestamp: new Date().toISOString()
        });
      });

      const sortedAlerts = alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      return {
        success: true,
        alerts: sortedAlerts,
        total: sortedAlerts.length,
        by_severity: {
          high: sortedAlerts.filter(a => a.severity === 'high').length,
          medium: sortedAlerts.filter(a => a.severity === 'medium').length,
          low: sortedAlerts.filter(a => a.severity === 'low').length
        }
      };
    });

    res.json(payload);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
