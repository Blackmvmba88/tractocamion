'use strict';

const { Truck } = require('../models');

exports.updatePosition = async (req, res) => {
  const { latitude, longitude, location } = req.body;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      (location !== undefined && (typeof location !== 'string' || !location.trim() || location.length > 255))) {
    return res.status(400).json({ error: 'Indica latitud (-90 a 90), longitud (-180 a 180) y una ubicación válida.' });
  }

  try {
    // Record reception time; source is manual until a tracker integration exists.
    const values = { latitude, longitude, position_updated_at: new Date(), position_source: 'manual' };
    if (location !== undefined) values.location = location.trim();
    const [count] = await Truck.update(values, { where: { id: req.params.id } });
    if (!count) return res.status(404).json({ error: 'Unidad no encontrada' });
    return res.json({ success: true, position: values });
  } catch (error) {
    console.error('Error updating truck position:', error.message);
    return res.status(500).json({ error: 'No fue posible guardar la posición' });
  }
};
