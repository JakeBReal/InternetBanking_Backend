const express = require('express');
const router = express.Router();
const { obtenerMontosCuenta, obtenerTodasCuentas } = require('../controllers/cuentas');

// Ruta para obtener montos de una cuenta específica
router.get('/:id/montos', obtenerMontosCuenta);

// Ruta para obtener todas las cuentas con sus montos
router.get('/', obtenerTodasCuentas);

module.exports = router; 