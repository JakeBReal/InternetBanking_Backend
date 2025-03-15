const pool = require('../db');

// Crear usuario con cuenta automática
const crearUsuario = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        
        const { nombre, cedula, correo, contrasena, tipo_cuenta, numero_cuenta, monto_inicial = 0 } = req.body;
        
        // Crear el usuario
        const usuarioResult = await client.query(
            'INSERT INTO usuarios (nombre, cedula, correo, contrasena) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, cedula, correo, contrasena]
        );
        
        const nuevoUsuario = usuarioResult.rows[0];
        
        // Generar número de cuenta aleatorio de 11 dígitos si no se proporciona uno
        const numeroCuenta = numero_cuenta || Math.floor(10000000000 + Math.random() * 90000000000).toString();
        
        // Crear la cuenta asociada al usuario
        const cuentaResult = await client.query(
            'INSERT INTO cuentas (numero_cuenta, tipo_cuenta, monto,  id_usuario) VALUES ($1, $2, $3, $4) RETURNING *',
            [numeroCuenta, tipo_cuenta || '1', 50000, nuevoUsuario.id]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
            usuario: nuevoUsuario,
            cuenta: cuentaResult.rows[0]
        });
        
    } catch (error) {
        console.log(error);
        
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Login de usuario
const loginUsuario = async (req, res) => {
    try {
        const { cedula, contrasena } = req.body;
        
        // Verificar que se proporcionen ambos campos
        if (!cedula || !contrasena) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }
        
        // Buscar el usuario por correo
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE cedula = $1',
            [cedula]
        );
        
        // Verificar si el usuario existe
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const usuario = result.rows[0];
        // Verificar la contraseña
        if (usuario.contrasena.toString() !== contrasena.toString()) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        // Login exitoso
        // No enviar la contraseña en la respuesta
        
        res.json({
            message: 'Login exitoso',
            id: usuario.id
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener usuario por ID
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, cedula, correo, contrasena, saldo } = req.body;
        const result = await pool.query(
            'UPDATE usuarios SET nombre = $1, cedula = $2, correo = $3, contrasena = $4, saldo = $5 WHERE id = $6 RETURNING *',
            [nombre, cedula, correo, contrasena, saldo, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    crearUsuario,
    loginUsuario,
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario
}; 