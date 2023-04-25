const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');



/* Lista de usuarios */

router.get('/usuarios', async (req, res) => {
    const { data, error } = await supabase.from('usuarios').select('id_usuario, correo, nombre, apellidos, rol');

    if (error) {
        return res.status(500).json({ error: 'Error al obtener los usuarios' });
    }

    res.status(200).json(data);
});


/* Buscar por id */

router.get('/usuarios/:id', async (req, res) => {
    const idUsuario = req.params.id;

    const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, correo, nombre, apellidos, rol')
        .eq('id_usuario', idUsuario);

    if (error) {
        return res.status(500).json({ error: 'Error al obtener el usuario' });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(data[0]);
});






/* Crear usuario */

router.post('/singup', async (req, res) => {
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



/* Login */

router.post('/login', async (req, res) => {
    // Verificar usuario y contraseña
    const { correo, password } = req.body;
    const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, correo, password, rol')
        .eq('correo', correo)
        .single();

    if (error) {
        return res.status(500).json({ error: 'Error al obtener el usuario' });
    }

    if (!data) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const { id_usuario, nombre, password: hashedPassword, rol } = data;
    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Almacenar información de sesión en req.session
    req.session.usuario = { id_usuario, nombre, correo, rol };
    return res.status(201).json({ message: 'Inicio de sesión exitoso' });

});





/* Perfil del usuario */

router.get('/account', async (req, res) => {
    // Obtener la información de sesión del usuario para verificar si está autenticado
    const usuarioId = req.session.usuario.id_usuario;

    if (usuarioId) {
        // Si el usuario está autenticado, hacer una consulta a la base de datos para obtener sus datos
        const { data, error } = await supabase
            .from('usuarios')
            .select('id_usuario, correo, nombre, apellidos, rol')
            .eq('id_usuario', usuarioId)
            .single();

        if (error) {
            return res.status(500).json({ error: 'Error al obtener el usuario' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Devolver los datos en formato JSON
        res.json(data);
    } else {
        // Si el usuario no está autenticado, redirigirlo a la página de inicio de sesión
        res.redirect('/');
    }
});




module.exports = router;
