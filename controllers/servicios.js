const pool = require('../db');

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
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Pago de servicio realizado con éxito',
            pago: result.rows[0],
            saldoAnterior: saldoDisponible,
            saldoNuevo: saldoDisponible - monto
        });
        
    } catch (error) {
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