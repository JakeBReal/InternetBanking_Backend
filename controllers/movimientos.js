const db = require('../db');

// Obtener saldo de una cuenta
const getSaldo = async (req, res) => {
  try {
    const { id_cuenta } = req.params;
    const result = await db.query('SELECT saldo FROM cuentas WHERE id_cuenta = $1', [id_cuenta]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el saldo' });
  }
};

// Obtener movimientos de una cuenta
const getMovimientos = async (req, res) => {
  try {
    const { id_cuenta } = req.params;
    const result = await db.query('SELECT * FROM movimientos WHERE id_cuenta = $1 ORDER BY fecha DESC', [id_cuenta]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los movimientos' });
  }
};

// Agregar un movimiento (deposito, retiro o transferencia)
const addMovimiento = async (req, res) => {
  try {
    const { id_cuenta, tipo, monto, descripcion } = req.body;

    // Obtener saldo actual
    const saldoResult = await db.query('SELECT saldo FROM cuentas WHERE id_cuenta = $1', [id_cuenta]);
    if (saldoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    
    let nuevoSaldo = parseFloat(saldoResult.rows[0].saldo);

    if (tipo === 'retiro' || tipo === 'transferencia') {
      if (nuevoSaldo < monto) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }
      nuevoSaldo -= monto;
    } else {
      nuevoSaldo += monto;
    }

    // Actualizar saldo en la cuenta
    await db.query('UPDATE cuentas SET saldo = $1 WHERE id_cuenta = $2', [nuevoSaldo, id_cuenta]);

    // Registrar movimiento
    const result = await db.query(
      'INSERT INTO movimientos (id_cuenta, tipo, monto, descripcion) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_cuenta, tipo, monto, descripcion]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el movimiento' });
  }
};

module.exports = {
  getSaldo,
  getMovimientos,
  addMovimiento
};
