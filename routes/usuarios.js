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



//Funciones
// Middleware de autenticación para verificar el token de autenticación
function authMiddleware(req, res, next) {
    // Obtener el token de autenticación de la cabecera de la solicitud
    const authToken = req.headers.authorization?.split(' ')[1];

    if (!authToken) {
        return res.status(401).json({ error: 'Se requiere autenticación' });
    }

    try {
        // Verificar el token de autenticación
        const decodedToken = jwt.verify(authToken, secretKey);

        // Almacenar los datos del usuario en la solicitud para su uso posterior
        req.usuario = decodedToken;

        // Continuar con la solicitud
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token de autenticación inválido' });
    }
}


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

// Obtener los datos del usuario que ha iniciado sesión
router.get('/usuarios', authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.usuario.id_usuario;

        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id_usuario', usuarioId)
            .single();

        if (error) {
            return res.status(500).json({ error: 'Error al obtener los datos del usuario' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener los datos del usuario' });
    }
});


// Ruta para obtener información del usuario autenticado
router.get('/perfil', authMiddleware, async (req, res) => {
    const usuarioId = req.usuario.id_usuario;
    const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, correo, nombre, apellidos')
        .eq('id_usuario', usuarioId)
        .single();

    if (error) {
        return res.status(500).json({ error: 'Error al obtener el usuario' });
    }

    if (!data) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json(data);
});


module.exports = router;
