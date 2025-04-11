const pool = require('../db');
const transporter = require('../config/email');

// Crear pago de servicio
const crearPagoServicio = async (req, res) => {
    const client = await pool.connect();
    try {   
        const { id } = req.params;
        await client.query('BEGIN');
        
        const { tipo_de_impuesto, numero_referencia, monto, cuenta_pago } = req.body;
        
        // Verificar saldo disponible en la cuenta
        const cuentaResult = await client.query(
            'SELECT monto FROM cuentas WHERE numero_cuenta = $1 FOR UPDATE',
            [cuenta_pago]
        );
        
        if (cuentaResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Cuenta no encontrada' });
        }
        
        const saldoDisponible = cuentaResult.rows[0].monto;
        
        if (saldoDisponible < monto) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Saldo insuficiente',
                saldoDisponible,
                montoSolicitado: monto
            });
        }
        
        // Actualizar saldo en la cuenta
        await client.query(
            'UPDATE cuentas SET monto = monto - $1 WHERE numero_cuenta = $2',
            [monto, cuenta_pago]
        );
        
        // Registrar el pago de servicio
        const fecha = new Date();
        const result = await client.query(
            'INSERT INTO servicios (tipo_de_impuesto, numero_referencia, monto, cuenta_pago, fecha, id_usuario) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [tipo_de_impuesto, numero_referencia, monto, cuenta_pago, fecha, id]
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
                subject: 'Confirmación de Pago de Servicio',
                html: `
                    <h2>Pago de Servicio Realizado</h2>
                    <p>Se ha realizado un pago de servicio con los siguientes detalles:</p>
                    <ul>
                        <li><strong>Servicio:</strong> ${tipo_de_impuesto}</li>
                        <li><strong>Número de Referencia:</strong> ${numero_referencia}</li>
                        <li><strong>Monto:</strong> $${monto}</li>
                        <li><strong>Cuenta:</strong> ${cuenta_pago}</li>
                        <li><strong>Fecha:</strong> ${fecha}</li>
                    </ul>
                    <p>Saldo anterior: $${saldoDisponible}</p>
                    <p>Nuevo saldo: $${(saldoDisponible - monto)}</p>
                    <p>Gracias por usar nuestros servicios.</p>
                `
            };
            
            try {
               await transporter.sendMail(mailOptions);
            } catch (emailError) {
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Pago de servicio realizado con éxito',
            pago: result.rows[0],
            saldoAnterior: saldoDisponible,
            saldoNuevo: saldoDisponible - monto
        });
        
    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Obtener todos los pagos de servicios
const obtenerPagosServicios = async (req, res) => {
    const { id } = req.params;
    try {   
        const result = await pool.query('SELECT * FROM servicios where id_usuario = $1 ORDER BY fecha DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener pagos de servicios por cuenta
const obtenerPagosPorCuenta = async (req, res) => {
    try {
        const { cuenta_pago } = req.params;
        const result = await pool.query(
            'SELECT * FROM servicios WHERE cuenta_pago = $1 ORDER BY fecha DESC',
            [cuenta_pago]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearPagoServicio,
    obtenerPagosServicios,
    obtenerPagosPorCuenta
}; 