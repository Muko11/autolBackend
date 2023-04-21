require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secretKey = 'asfsa93GL45GDDJAjsws';

// Configuración de Supabase
const supabaseUrl = process.env.BD_URI;
const supabaseKey = process.env.API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// Ruta GET para obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    const { data, error } = await supabase.from('usuarios').select('*');

    if (error) {
        return res.status(500).json({ error: 'Error al obtener los usuarios' });
    }

    res.status(200).json(data);
});


// Ruta GET para buscar un usuario por su id
router.get('/usuarios/:id', async (req, res) => {
    const idUsuario = req.params.id;

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id_usuario', idUsuario);

    if (error) {
        return res.status(500).json({ error: 'Error al obtener el usuario' });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(data[0]);
});




// Ruta POST para crear un nuevo usuario
router.post('/usuarios/singup', async (req, res) => {
    const { nombre, apellidos, correo, password, rol } = req.body;

    // Hasheamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buscamos si ya existe un usuario con ese correo
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correo);

    if (error) {
        return res.status(500).json({ error: 'Error al buscar el usuario' });
    }

    if (users.length > 0) {
        return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    // Insertamos el usuario en la base de datos
    const { data, error: insertError } = await supabase
        .from('usuarios')
        .insert({ nombre, apellidos, correo, password: hashedPassword, rol });

    if (insertError) {
        return res.status(500).json({ error: 'Error al crear el usuario' });
    }

    res.status(201).json({ message: 'Usuario creado correctamente' });
});


//Post para Login
router.post('/usuarios/login', async (req, res) => {
    // Verificar usuario y contraseña
    const { correo, password } = req.body;
    const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, correo, password, rol')
        .eq('correo', correo)
        .single();

    if (error) {
        return res.status(500).json({ error: 'Error al obtener el usuario' });
    }

    if (!data) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const { id_usuario, password: hashedPassword, rol } = data;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar token de autenticación y almacenarlo en el local storage
    const token = jwt.sign({ id_usuario, correo, rol }, secretKey, { expiresIn: '1d' });

    // Enviar respuesta al cliente con el token de autenticación
    res.status(200).json({ message: 'Inicio de sesión exitoso', token });

});


// Middleware para verificar token de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token de autenticación inválido' });
        }

        req.user = user;
        next();
    });
}

// Ruta para obtener información del usuario autenticado
router.get('/me', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        return res.status(500).json({ error: 'Error al obtener la información del usuario' });
    }

    res.status(200).json(user);
});


module.exports = router;
