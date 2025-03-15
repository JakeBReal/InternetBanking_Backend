const pool = require('../db');

// Crear transferencia
const crearTransferencia = async (req, res) => {
    try {
        const { origen_id, destino_id, monto } = req.body;
        
        // Iniciar transacción
        await pool.query('BEGIN');
        
        // Verificar saldo suficiente
        const origen = await pool.query('SELECT saldo FROM usuarios WHERE id = $1', [origen_id]);
        if (origen.rows[0].saldo < monto) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ message: 'Saldo insuficiente' });
        }
        
        // Realizar la transferencia
        await pool.query('UPDATE usuarios SET saldo = saldo - $1 WHERE id = $2', [monto, origen_id]);
        await pool.query('UPDATE usuarios SET saldo = saldo + $1 WHERE id = $2', [monto, destino_id]);
        
        // Registrar la transferencia
        const result = await pool.query(
            'INSERT INTO transferencias (origen_id, destino_id, monto) VALUES ($1, $2, $3) RETURNING *',
            [origen_id, destino_id, monto]
        );
        
        await pool.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
};

// Obtener todas las transferencias
const obtenerTransferencias = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transferencias');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener transferencias por usuario
const obtenerTransferenciasPorUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM transferencias WHERE origen_id = $1 OR destino_id = $1',
            [usuario_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearTransferencia,
    obtenerTransferencias,
    obtenerTransferenciasPorUsuario
}; 