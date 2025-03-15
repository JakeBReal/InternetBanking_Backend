const pool = require('../db');

// Crear beneficiario
const crearBeneficiario = async (req, res) => {
    try {
        const { usuario_id, beneficiario_id, alias } = req.body;
        const result = await pool.query(
            'INSERT INTO beneficiarios (usuario_id, beneficiario_id, alias) VALUES ($1, $2, $3) RETURNING *',
            [usuario_id, beneficiario_id, alias]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los beneficiarios
const obtenerBeneficiarios = async (req, res) => {
    try {
        console.log('entro');
        
        const result = await pool.query('SELECT * FROM beneficiarios');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener beneficiarios por usuario
const obtenerBeneficiariosPorUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const result = await pool.query('SELECT * FROM beneficiarios WHERE usuario_id = $1', [usuario_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar beneficiario
const actualizarBeneficiario = async (req, res) => {
    try {
        const { id } = req.params;
        const { alias } = req.body;
        const result = await pool.query(
            'UPDATE beneficiarios SET alias = $1 WHERE id = $2 RETURNING *',
            [alias, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Beneficiario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar beneficiario
const eliminarBeneficiario = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM beneficiarios WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Beneficiario no encontrado' });
        }
        res.json({ message: 'Beneficiario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearBeneficiario,
    obtenerBeneficiarios,
    obtenerBeneficiariosPorUsuario,
    actualizarBeneficiario,
    eliminarBeneficiario
}; 