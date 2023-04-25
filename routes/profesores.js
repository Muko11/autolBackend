const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');


/* Lista de profesores */

router.get('/profesores', async (req, res) => {
    const { data, error } = await supabase
        .from('usuarios')
        .select('nombre, apellidos, correo')
        .join('profesores', { on: 'usuarios.id_usuario = profesores.id_profesor' })
    if (error) {
        return res.status(500).json({ error: 'Error al obtener los usuarios' });
    }

    res.status(200).json(data);
});

module.exports = router;