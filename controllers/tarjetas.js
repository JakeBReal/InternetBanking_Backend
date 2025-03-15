const pool = require('../db');

// Crear tarjeta
const crearTarjeta = async (req, res) => {
    try {
        const { usuario_id, numero_tarjeta, limite_credito } = req.body;
        const result = await pool.query(
            'INSERT INTO tarjetas (usuario_id, numero_tarjeta, limite_credito, disponible) VALUES ($1, $2, $3, $3) RETURNING *',
            [usuario_id, numero_tarjeta, limite_credito]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todas las tarjetas
const obtenerTarjetas = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tarjetas');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener tarjetas por usuario
const obtenerTarjetasPorUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const result = await pool.query('SELECT * FROM tarjetas WHERE usuario_id = $1', [usuario_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar tarjeta
const actualizarTarjeta = async (req, res) => {
    try {
        const { id } = req.params;
        const { limite_credito, disponible, estado } = req.body;
        const result = await pool.query(
            'UPDATE tarjetas SET limite_credito = $1, disponible = $2, estado = $3 WHERE id = $4 RETURNING *',
            [limite_credito, disponible, estado, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tarjeta no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar tarjeta
const eliminarTarjeta = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tarjetas WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tarjeta no encontrada' });
        }
        res.json({ message: 'Tarjeta eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearTarjeta,
    obtenerTarjetas,
    obtenerTarjetasPorUsuario,
    actualizarTarjeta,
    eliminarTarjeta
};
