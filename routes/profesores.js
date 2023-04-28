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

router.post('/profesor/:id_profesor/:id_autoescuela', async (req, res) => {
    const { id_profesor, id_autoescuela } = req.params;
    try {
        // Buscar si el profesor ya está asociado a una autoescuela
        const { data: profesores } = await supabase
            .from('profesores')
            .select('*')
            .eq('id_profesor', id_profesor)
            .not('id_autoescuela', 'is', null);

        if (profesores.length > 0) {
            return res.status(400).json({ error: 'El profesor ya está asociado a una autoescuela' });
        }

        const { data, error } = await supabase
            .from('profesores')
            .insert([{ id_profesor, id_autoescuela }]);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'No se ha podido insertar el registro' });
        }

        res.status(201).json({ id_profesor, id_autoescuela });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error en la inserción' });
    }
});




module.exports = router;
