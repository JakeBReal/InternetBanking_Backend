const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const usuariosController = require('./controllers/usuarios');
const transaccionesController = require('./controllers/transacciones');
const tarjetasController = require('./controllers/tarjetas');
const beneficiariosController = require('./controllers/beneficiarios');
const transferenciasController = require('./controllers/transferencias');
const cuentasController = require('./controllers/cuentas');
const serviciosController = require('./controllers/servicios');
const depositosController = require('./controllers/depositos');

// Rutas de usuarios
app.post('/api/usuarios', usuariosController.crearUsuario);
app.post('/api/login', usuariosController.loginUsuario);
app.get('/api/usuarios', usuariosController.obtenerUsuarios);
app.get('/api/usuarios/:id', usuariosController.obtenerUsuarioPorId);
app.put('/api/usuarios/:id', usuariosController.actualizarUsuario);
app.delete('/api/usuarios/:id', usuariosController.eliminarUsuario);

// Rutas de transacciones
app.post('/api/transacciones/:id', transaccionesController.crearTransaccion);
app.get('/api/transacciones/:id', transaccionesController.obtenerTransacciones);
app.get('/api/transacciones/usuario/:usuario_id', transaccionesController.obtenerTransaccionesPorUsuario);
app.put('/api/transacciones/:id', transaccionesController.actualizarTransaccion);
app.delete('/api/transacciones/:id', transaccionesController.eliminarTransaccion);

// Rutas de tarjetas
app.post('/api/tarjetas', tarjetasController.crearTarjeta);
app.get('/api/tarjetas', tarjetasController.obtenerTarjetas);
app.get('/api/tarjetas/usuario/:usuario_id', tarjetasController.obtenerTarjetasPorUsuario);
app.put('/api/tarjetas/:id', tarjetasController.actualizarTarjeta);
app.delete('/api/tarjetas/:id', tarjetasController.eliminarTarjeta);

// Rutas de beneficiarios
app.post('/api/beneficiarios', beneficiariosController.crearBeneficiario);
app.get('/api/beneficiarios', beneficiariosController.obtenerBeneficiarios);
app.get('/api/beneficiarios/usuario/:usuario_id', beneficiariosController.obtenerBeneficiariosPorUsuario);
app.put('/api/beneficiarios/:id', beneficiariosController.actualizarBeneficiario);
app.delete('/api/beneficiarios/:id', beneficiariosController.eliminarBeneficiario);

// Rutas de transferencias
app.post('/api/transferencias', transferenciasController.crearTransferencia);
app.get('/api/transferencias', transferenciasController.obtenerTransferencias);
app.get('/api/transferencias/usuario/:usuario_id', transferenciasController.obtenerTransferenciasPorUsuario);

// Rutas de cuentas
app.get('/api/cuentas/:id/montos', cuentasController.obtenerMontosCuenta);
app.get('/api/cuentas/:id', cuentasController.obtenerTodasCuentas);
app.post('/api/cuentas/transaccion/:id', cuentasController.realizarTransaccion);

// Rutas de servicios
app.post('/api/servicios/:id', serviciosController.crearPagoServicio);
app.get('/api/servicios/:id', serviciosController.obtenerPagosServicios);
app.get('/api/servicios/cuenta/:cuenta_pago', serviciosController.obtenerPagosPorCuenta);

// Rutas de depósitos
app.post('/api/depositos/:id', depositosController.crearDeposito);
app.get('/api/depositos/:id', depositosController.obtenerDepositosPorUsuario);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
