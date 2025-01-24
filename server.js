// Importar dependencias
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { poolPromise, sql } = require('./database'); // Conexión con SQL Server

// Configuración inicial
const app = express();
const PORT = 3001;
const SECRET_KEY = "mi_secreto";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Registro de usuario
app.post('/registro', async (req, res) => {
    const { nombre, correo, contrasena } = req.body;
    const hash = bcrypt.hashSync(contrasena, 10);

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('correo', sql.VarChar, correo)
            .input('contrasena', sql.VarChar, hash)
            .query(`
                INSERT INTO usuarios (nombre, correo, contrasena) 
                VALUES (@nombre, @correo, @contrasena);
            `);

        res.json({ mensaje: 'Usuario registrado con éxito', id: result.recordset });
    } catch (err) {
        res.status(400).json({ error: 'Error al registrar usuario: ' + err.message });
    }
});

// Inicio de sesión
app.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM usuarios WHERE correo = @correo');

        const usuario = result.recordset[0];
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const esValida = bcrypt.compareSync(contrasena, usuario.contrasena);
        if (!esValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: usuario.id, nombre: usuario.nombre }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ mensaje: 'Inicio de sesión exitoso', token });
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
    }
});

// Consultar saldo
app.get('/saldo', async (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, decoded.id)
            .query('SELECT saldo FROM usuarios WHERE id = @id');

        const usuario = result.recordset[0];
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ saldo: usuario.saldo });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
