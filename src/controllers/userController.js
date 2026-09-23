'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { User, Operator } = db;

const operatorInclude = {
  model: Operator,
  as: 'operator',
  attributes: ['id', 'code', 'name', 'status'],
  required: false
};

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    operator_id: user.operator_id,
    is_active: user.is_active,
    last_login: user.last_login,
    createdAt: user.createdAt,
    operator: user.operator || null
  };
}

async function ensureOperatorAvailable(operatorId, userId, transaction) {
  if (!operatorId) {
    const error = new Error('Las cuentas de operador deben vincularse a un operador');
    error.statusCode = 400;
    throw error;
  }

  const operator = await Operator.findByPk(operatorId, { transaction });
  if (!operator) {
    const error = new Error('El operador seleccionado no existe');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({
    where: {
      operator_id: operatorId,
      ...(userId ? { id: { [Op.ne]: userId } } : {})
    },
    transaction
  });
  if (existingUser) {
    const error = new Error('El operador seleccionado ya tiene una cuenta');
    error.statusCode = 409;
    throw error;
  }
}

exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [operatorInclude],
      order: [['createdAt', 'ASC']]
    });
    res.json({ users: users.map(publicUser), total: users.length });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role, operator_id } = req.body;
  try {
    const user = await db.sequelize.transaction(async (transaction) => {
      const duplicate = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] },
        transaction
      });
      if (duplicate) {
        const error = new Error('El usuario o email ya está registrado');
        error.statusCode = 409;
        throw error;
      }

      if (role === 'operador') {
        await ensureOperatorAvailable(operator_id, null, transaction);
      }

      return User.create({
        username,
        email,
        password,
        role,
        operator_id: role === 'operador' ? operator_id : null,
        is_active: true
      }, { transaction });
    });

    res.status(201).json({ message: 'Usuario creado', user: publicUser(user) });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Datos de usuario inválidos' });
    }
    res.status(error.statusCode || 500).json({ error: error.message || 'Error al crear usuario' });
  }
};

exports.updateUser = async (req, res) => {
  const targetId = Number(req.params.id);
  const { role, operator_id, is_active } = req.body;

  try {
    const updatedUser = await db.sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(targetId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
      }

      const nextRole = role || user.role;
      const nextActive = typeof is_active === 'boolean' ? is_active : user.is_active;
      const removesAdminAccess = user.role === 'admin' && (nextRole !== 'admin' || !nextActive);

      if (removesAdminAccess) {
        const activeAdmins = await User.count({
          where: { role: 'admin', is_active: true },
          transaction
        });
        if (activeAdmins <= 1) {
          const error = new Error('No puedes desactivar o degradar al último administrador activo');
          error.statusCode = 409;
          throw error;
        }
      }

      if (nextRole === 'operador') {
        await ensureOperatorAvailable(operator_id ?? user.operator_id, user.id, transaction);
      }

      await user.update({
        role: nextRole,
        operator_id: nextRole === 'operador' ? (operator_id ?? user.operator_id) : null,
        is_active: nextActive
      }, { transaction });

      return user;
    });

    res.json({ message: 'Usuario actualizado', user: publicUser(updatedUser) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Error al actualizar usuario' });
  }
};
