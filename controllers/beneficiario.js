const db = require('../db');

// Obtener todos los beneficiarios de un cliente
const getBeneficiarios = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const result = await db.query('SELECT * FROM beneficiarios WHERE id_cliente = $1', [id_cliente]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los beneficiarios' });
  }
};

// Obtener beneficiario por ID
const getBeneficiarioById = async (req, res) => {
  try {
    const { id_beneficiario } = req.params;
    const result = await db.query('SELECT * FROM beneficiarios WHERE id_beneficiario = $1', [id_beneficiario]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el beneficiario' });
  }
};

// Agregar un beneficiario
const addBeneficiario = async (req, res) => {
  try {
    const { id_cliente, nombre, numero_cuenta, banco, tipo_cuenta, alias } = req.body;
    const result = await db.query(
      'INSERT INTO beneficiarios (id_cliente, nombre, numero_cuenta, banco, tipo_cuenta, alias) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id_cliente, nombre, numero_cuenta, banco, tipo_cuenta, alias]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar el beneficiario' });
  }
};

// Actualizar beneficiario
const updateBeneficiario = async (req, res) => {
  try {
    const { id_beneficiario, nombre, numero_cuenta, banco, tipo_cuenta, alias } = req.body;
    const result = await db.query(
      'UPDATE beneficiarios SET nombre = $1, numero_cuenta = $2, banco = $3, tipo_cuenta = $4, alias = $5 WHERE id_beneficiario = $6 RETURNING *',
      [nombre, numero_cuenta, banco, tipo_cuenta, alias, id_beneficiario]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el beneficiario' });
  }
};

// Eliminar beneficiario
const deleteBeneficiario = async (req, res) => {
  try {
    const { id_beneficiario } = req.params;
    const result = await db.query('DELETE FROM beneficiarios WHERE id_beneficiario = $1 RETURNING *', [id_beneficiario]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' });
    }
    res.status(200).json({ message: 'Beneficiario eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el beneficiario' });
  }
};

module.exports = {
  getBeneficiarios,
  getBeneficiarioById,
  addBeneficiario,
  updateBeneficiario,
  deleteBeneficiario
};
