const e = require('express');
const pool = require('../db');

// Crear un depósito y actualizar saldo
const crearDeposito = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params; // id_usuario
        const { numero_cuenta, monto, referencia, concepto } = req.body;
        
        // Verificar que la cuenta exista y pertenezca al usuario
        const cuentaResult = await client.query(
            'SELECT * FROM cuentas WHERE numero_cuenta = $1 AND id_usuario = $2 FOR UPDATE',
            [numero_cuenta, id]
        );
        
        if (cuentaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Cuenta no encontrada o no pertenece al usuario' });
        }
        
        // Registrar el depósito
        const fecha = new Date();
        const depositoResult = await client.query(
            'INSERT INTO depositos (numero_cuenta, monto, referencia, concepto, id_usuario, fecha) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [numero_cuenta, monto, referencia, concepto, id, fecha]
        );
        
        // Actualizar el saldo en la cuenta
        await client.query(
            'UPDATE cuentas SET monto = monto + $1 WHERE numero_cuenta = $2',
            [monto, numero_cuenta]
        );
        
        // Obtener saldo actualizado
        const saldoActualizadoResult = await client.query(
            'SELECT monto FROM cuentas WHERE numero_cuenta = $1',
            [numero_cuenta]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Depósito realizado con éxito',
            deposito: depositoResult.rows[0],
            saldo_anterior: cuentaResult.rows[0].monto_corriente,
            saldo_nuevo: saldoActualizadoResult.rows[0].monto_corriente
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Obtener depósitos por usuario
const obtenerDepositosPorUsuario = async (req, res) => {
    try {
        const { id } = req.params; // id_usuario
        
        const result = await pool.query(
            'SELECT * FROM depositos WHERE id_usuario = $1 ORDER BY fecha DESC',
            [id]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearDeposito,
    obtenerDepositosPorUsuario
}; 