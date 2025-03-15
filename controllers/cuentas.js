const pool = require('../db');

// Obtener montos de cuenta (corriente y ahorro)
const obtenerMontosCuenta = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT monto_corriente, monto_ahorro FROM cuentas WHERE id = $1 and id_usuario = $2',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cuenta no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todas las cuentas con sus montos
const obtenerTodasCuentas = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM cuentas where id_usuario = $1',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Realizar transacción y actualizar saldo
const realizarTransaccion = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { cuenta_origen, cuenta_destino, monto, concepto } = req.body;
        // Verificar saldo disponible en la cuenta origen
        const cuentaOrigenResult = await client.query(
            'SELECT monto FROM cuentas WHERE numero_cuenta = $1 FOR UPDATE',
            [cuenta_origen]
        );
        
        if (cuentaOrigenResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Cuenta origen no encontrada' });
        }
        
        const saldoDisponible = cuentaOrigenResult.rows[0].monto;
        
        if (saldoDisponible < monto) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Saldo insuficiente',
                saldoDisponible,
                montoSolicitado: monto
            });
        }
        
        // Actualizar saldo en cuenta origen
        await client.query(
            'UPDATE cuentas SET monto = monto - $1 WHERE numero_cuenta = $2',
            [monto, cuenta_origen]
        );
        
        // Registrar la transacción
        const fecha = new Date();
        await client.query(
            'INSERT INTO transacciones (cuenta_origen, cuenta_destino, monto, concepto, fecha,id_usuario) VALUES ($1, $2, $3, $4, $5, $6)',
            [cuenta_origen, cuenta_destino, monto, concepto, fecha, id]
        );
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Transacción realizada con éxito',
            saldoAnterior: saldoDisponible,
            saldoNuevo: saldoDisponible - monto,
            monto,
            fecha
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

module.exports = {
    obtenerMontosCuenta,
    obtenerTodasCuentas,
    realizarTransaccion
}; 