const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');

router.get('/autoescuelas', async (req, res) => {
    const { data, error } = await supabase.from('autoescuelas').select('*');

    if (error) {
        return res.status(500).json({ error: 'Error al obtener las autoescuelas' });
    }

    res.status(200).json(data);
});

router.post('/autoescuela', async (req, res) => {
    const { nombre, telefono, precio_practica, id_administrador } = req.body;
    try {
        const { data: autoescuela, error } = await supabase
            .from('autoescuelas')
            .insert([{ nombre, telefono, precio_practica, id_administrador: null }])
            .single();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'No se ha podido insertar la autoescuela' });
        }

        const { data: latestAutoescuela, error: latestAutoescuelaError } = await supabase
            .from('autoescuelas')
            .select('*')
            .order('id_autoescuela', { ascending: false })
            .limit(1);

        if (latestAutoescuelaError) {
            console.error(latestAutoescuelaError);
            return res.status(500).json({ error: 'No se ha podido obtener la autoescuela' });
        }

        const infoAutoescuela = latestAutoescuela[0];
        console.log(infoAutoescuela)

        res.status(201).json(infoAutoescuela);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error en la autoescuela' });
    }
});



router.get('/autoescuela/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const { data: autoescuela, error } = await supabase
            .from('autoescuelas')
            .select('*')
            .eq('id_administrador', id_usuario)
            .single();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'No se ha podido obtener la información de la autoescuela' });
        }

        res.status(200).json(autoescuela);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error en la obtención de información de la autoescuela' });
    }
});


router.post('/autoescuela/:id_autoescuela/:id_profesor', async (req, res) => {
    const { id_autoescuela, id_profesor } = req.params;

    try {
        // Consultar la autoescuela por su ID
        const { data: autoescuelaData, error: autoescuelaError } = await supabase
            .from('autoescuelas')
            .select('id_autoescuela')
            .eq('id_autoescuela', id_autoescuela)
            .single();

        // Si hay un error en la consulta, devolver una respuesta con error
        if (autoescuelaError) {
            console.error(autoescuelaError);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        // Si no se encuentra la autoescuela, devolver una respuesta con error
        if (!autoescuelaData) {
            return res.status(404).json({ error: 'No se ha encontrado la autoescuela' });
        }

        // Actualizar la autoescuela con el nuevo ID de administrador
        const { error: updateError } = await supabase
            .from('autoescuelas')
            .update({ id_administrador: id_profesor })
            .eq('id_autoescuela', id_autoescuela);

        // Si hay un error en la actualización, devolver una respuesta con error
        if (updateError) {
            console.error(updateError);
            return res.status(500).json({ error: 'No se ha podido actualizar la autoescuela' });
        }

        // Devolver una respuesta exitosa
        res.status(200).json({ message: 'Se ha actualizado la autoescuela correctamente', id_autoescuela, id_profesor });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error en la actualización' });
    }
});




module.exports = router;