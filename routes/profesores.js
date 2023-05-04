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


/* Comprobar si el profesor ya esta insertado en la tabla profesores para asignarle el id_autoescuela correspondiente */

router.get("/profesor/:id_profesor", async (req, res) => {
    const { id_profesor } = req.params;

    try {
        const { data: profesor, error } = await supabase
            .from("profesores")
            .select("*")
            .eq("id_profesor", id_profesor)
            .single();

        if (error) throw error;

        if (profesor) {
            // Si se encontró el profesor, se envía la información en formato JSON
            res.json(profesor);
        } else {
            // Si no se encontró el profesor, se envía una respuesta de error
            res.status(404).json({ message: "Profesor no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el profesor" });
    }
});


/* A */

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
            .insert([{ id_profesor: id_profesor, id_autoescuela }]);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'No se ha podido insertar el registro' });
        }

        res.status(201).json({ id_profesor: id_profesor, id_autoescuela });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error en la inserción' });
    }
});




/* Asignar profesor a una autoescuela */

router.post('/profesor/agregar/:correo/:id_autoescuela', async (req, res) => {
    const { correo, id_autoescuela } = req.params;

    try {
        // Obtener id_usuario a partir del correo
        const { data: usuarios, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id_usuario')
            .eq('correo', correo)
            .single();

        if (errorUsuario || !usuarios) {
            return res.status(404).json({ error: 'No se ha encontrado ningún usuario con ese correo' });
        }

        const id_profesor = usuarios.id_usuario;

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
            .insert([{ id_profesor: id_profesor, id_autoescuela }]);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'No se ha podido insertar el registro' });
        }

        res.status(201).json({ id_profesor: id_profesor, id_autoescuela });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error en la inserción' });
    }
});


module.exports = router;
