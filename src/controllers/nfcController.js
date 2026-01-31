'use strict';

const db = require('../models');
const { Operator } = db;

/**
 * NFC Controller - Handles NFC/RFID tag operations
 * Part of "absoluteness" integration - completing the identification system
 */

/**
 * Verify NFC tag and get operator info
 * POST /api/nfc/verify
 */
exports.verifyTag = async (req, res) => {
  const { tag_id } = req.body;
  
  if (!tag_id) {
    return res.status(400).json({
      success: false,
      error: 'tag_id is required'
    });
  }
  
  try {
    // Find operator by NFC tag
    const operator = await Operator.findOne({
      where: { nfc_tag_id: tag_id }
    });
    
    if (!operator) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: 'NFC tag not registered',
        tag_id: tag_id
      });
    }
    
    // Return operator info
    res.json({
      success: true,
      verified: true,
      operator: {
        id: operator.id,
        code: operator.code,
        name: operator.name,
        status: operator.status,
        total_cycles: operator.total_cycles,
        total_earnings: parseFloat(operator.total_earnings)
      },
      message: `Welcome, ${operator.name}!`
    });
  } catch (error) {
    console.error('Error verifying NFC tag:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Register NFC tag to operator
 * POST /api/nfc/register
 */
exports.registerTag = async (req, res) => {
  const { operator_id, tag_id } = req.body;
  
  if (!operator_id || !tag_id) {
    return res.status(400).json({
      success: false,
      error: 'operator_id and tag_id are required'
    });
  }
  
  try {
    // Check if operator exists
    const operator = await Operator.findByPk(operator_id);
    if (!operator) {
      return res.status(404).json({
        success: false,
        error: `Operator ${operator_id} not found`
      });
    }
    
    // Check if tag is already registered
    const existingTag = await Operator.findOne({
      where: { nfc_tag_id: tag_id }
    });
    
    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: `NFC tag ${tag_id} is already registered to operator ${existingTag.code}`
      });
    }
    
    // Register tag
    await operator.update({ nfc_tag_id: tag_id });
    
    res.json({
      success: true,
      message: `NFC tag registered successfully to operator ${operator.code}`,
      operator: {
        id: operator.id,
        code: operator.code,
        name: operator.name,
        nfc_tag_id: tag_id
      }
    });
  } catch (error) {
    console.error('Error registering NFC tag:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Unregister NFC tag from operator
 * POST /api/nfc/unregister
 */
exports.unregisterTag = async (req, res) => {
  const { operator_id } = req.body;
  
  if (!operator_id) {
    return res.status(400).json({
      success: false,
      error: 'operator_id is required'
    });
  }
  
  try {
    const operator = await Operator.findByPk(operator_id);
    if (!operator) {
      return res.status(404).json({
        success: false,
        error: `Operator ${operator_id} not found`
      });
    }
    
    if (!operator.nfc_tag_id) {
      return res.status(400).json({
        success: false,
        error: `Operator ${operator.code} does not have a registered NFC tag`
      });
    }
    
    await operator.update({ nfc_tag_id: null });
    
    res.json({
      success: true,
      message: `NFC tag unregistered from operator ${operator.code}`,
      operator: {
        id: operator.id,
        code: operator.code,
        name: operator.name
      }
    });
  } catch (error) {
    console.error('Error unregistering NFC tag:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Quick check-in using NFC tag (combines verify + cycle start)
 * POST /api/nfc/checkin
 */
exports.quickCheckin = async (req, res) => {
  const { tag_id, truck_id } = req.body;
  
  if (!tag_id || !truck_id) {
    return res.status(400).json({
      success: false,
      error: 'tag_id and truck_id are required'
    });
  }
  
  try {
    // Verify NFC tag
    const operator = await Operator.findOne({
      where: { nfc_tag_id: tag_id }
    });
    
    if (!operator) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: 'NFC tag not registered'
      });
    }
    
    // Check operator status
    if (operator.status === 'resting') {
      return res.status(400).json({
        success: false,
        error: `Operator ${operator.code} is on mandatory rest period`,
        operator: {
          code: operator.code,
          name: operator.name,
          status: operator.status
        }
      });
    }
    
    if (operator.status === 'working') {
      return res.status(400).json({
        success: false,
        error: `Operator ${operator.code} is already working on another cycle`,
        operator: {
          code: operator.code,
          name: operator.name,
          status: operator.status
        }
      });
    }
    
    res.json({
      success: true,
      verified: true,
      ready_for_cycle: true,
      operator: {
        id: operator.id,
        code: operator.code,
        name: operator.name,
        status: operator.status
      },
      message: `Operator ${operator.name} verified and ready to start cycle`,
      next_step: `POST /api/cycles with operator_id=${operator.id} and truck_id=${truck_id}`
    });
  } catch (error) {
    console.error('Error in NFC check-in:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
