const pool = require('../db');

// Crear transacción
const crearTransaccion = async (req, res) => {
    try {
        const { usuario_id, tipo, monto } = req.body;
        const result = await pool.query(
            'INSERT INTO transacciones (usuario_id, tipo, monto) VALUES ($1, $2, $3) RETURNING *',
            [usuario_id, tipo, monto]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todas las transacciones
const   obtenerTransacciones = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM transacciones where id_usuario = $1', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener transacciones por usuario
const obtenerTransaccionesPorUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const result = await pool.query('SELECT * FROM transacciones WHERE usuario_id = $1', [usuario_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar transacción
const actualizarTransaccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, monto } = req.body;
        const result = await pool.query(
            'UPDATE transacciones SET tipo = $1, monto = $2 WHERE id = $3 RETURNING *',
            [tipo, monto, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar transacción
const eliminarTransaccion = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM transacciones WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }
        res.json({ message: 'Transacción eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearTransaccion,
    obtenerTransacciones,
    obtenerTransaccionesPorUsuario,
    actualizarTransaccion,
    eliminarTransaccion
}; 