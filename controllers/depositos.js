const e = require('express');
const pool = require('../db');
const transporter = require('../config/email');

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
        
        // Obtener el correo del usuario
        const usuarioResult = await client.query(
            'SELECT correo FROM usuarios WHERE id = $1',
            [id]
        );
        
        if (usuarioResult.rows.length > 0) {
            const correoUsuario = usuarioResult.rows[0].correo;
            
            // Enviar correo electrónico
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: correoUsuario,
                subject: 'Confirmación de Depósito',
                html: `
                    <h2>Depósito Realizado</h2>
                    <p>Se ha realizado un depósito con los siguientes detalles:</p>
                    <ul>
                        <li><strong>Número de Cuenta:</strong> ${numero_cuenta}</li>
                        <li><strong>Monto Depositado:</strong> $${monto}</li>
                        <li><strong>Referencia:</strong> ${referencia}</li>
                        <li><strong>Concepto:</strong> ${concepto}</li>
                        <li><strong>Fecha:</strong> ${fecha.toLocaleString()}</li>
                    </ul>
                    <p>Saldo anterior: $${cuentaResult.rows[0].monto}</p>
                    <p>Nuevo saldo: $${saldoActualizadoResult.rows[0].monto}</p>
                    <p>Gracias por usar nuestros servicios.</p>
                `
            };
            
            try {
                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Error al enviar el correo:', emailError);
                // No hacemos rollback si falla el envío del correo
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Depósito realizado con éxito',
            deposito: depositoResult.rows[0],
            saldo_anterior: cuentaResult.rows[0].monto,
            saldo_nuevo: saldoActualizadoResult.rows[0].monto
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