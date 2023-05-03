const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');

/* Listar autoescuelas */

router.get('/autoescuelas', async (req, res) => {
    const { data, error } = await supabase.from('autoescuelas').select('*');

    if (error) {
        return res.status(500).json({ error: 'Error al obtener las autoescuelas' });
    }

    res.status(200).json(data);
});



/* Buscar datos de la autoescuela por id_administrador */

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



/* Crear autoescuela */

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



/* Asignar id_profesor como id_administrador al crear la autoescuela */

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


router.put('/autoescuela/:id_autoescuela/:id_administrador', async (req, res) => {
    const { id_autoescuela, id_administrador } = req.params;
    const { nombre, telefono, precio_practica } = req.body;

    try {
        // Obtener la autoescuela de la base de datos usando Supabase
        const { data, error } = await supabase
            .from('autoescuelas')
            .update({ nombre, telefono, precio_practica })
            .eq('id_autoescuela', id_autoescuela)
            .eq('id_administrador', id_administrador);
        console.log(data)
        if (error) {
            throw error;
        }

        // Si se ha modificado la autoescuela, devolver los nuevos datos
        if (data) {
            res.status(200).json(data);
        } else {
            res.status(404).json({ error: 'No se ha encontrado la autoescuela' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Ha ocurrido un error al modificar la autoescuela');
    }
});



router.put('/autoescuela/:id_administrador', async (req, res) => {
    const { id_administrador } = req.params;
    const { nombre, telefono, precio_practica } = req.body;

    try {
        // Obtener la autoescuela de la base de datos usando Supabase
        const { data: updateData, error: updateError } = await supabase
            .from('autoescuelas')
            .update({ nombre, telefono, precio_practica })
            .eq('id_administrador', id_administrador);

        if (updateError) {
            throw updateError;
        }

        // Verificar si la fila se ha actualizado correctamente
        const { data: autoescuela, error: selectError } = await supabase
            .from('autoescuelas')
            .select()
            .eq('id_administrador', id_administrador);

        if (selectError) {
            throw selectError;
        }

        // Si se ha encontrado la autoescuela, devolver los datos
        if (autoescuela && autoescuela.length > 0) {
            res.status(200).json(autoescuela[0]);
        } else {
            res.status(404).json({ error: 'No se ha encontrado la autoescuela' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Ha ocurrido un error al obtener la autoescuela');
    }
});







module.exports = router;