const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');

/* Comprobar si el alumno ya esta insertado en la tabla alumno para asignarle el id_autoescuela correspondiente */

router.get("/alumno/:id_alumno", async (req, res) => {
    const { id_alumno } = req.params;

    try {
        const { data: alumno, error } = await supabase
            .from("alumnos")
            .select("*")
            .eq("id_alumno", id_alumno)
            .single();

        if (error) throw error;

        if (alumno) {
            // Si se encontró el alumno, se envía la información en formato JSON
            res.json(alumno);
        } else {
            // Si no se encontró el alumno, se envía una respuesta de error
            res.status(404).json({ message: "Alumno no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el alumno" });
    }
});

/* Lista de alumnos por id_autoescuela*/

router.get('/alumno/autoescuela/:id_autoescuela', async (req, res) => {
    const { id_autoescuela } = req.params;

    try {
        const { data: alumnos, error } = await supabase
            .from('alumnos')
            .select('*')
            .eq('id_autoescuela', id_autoescuela);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        const alumnosConUsuarios = await Promise.all(
            alumnos.map(async (alumno) => {
                const { data: usuario } = await supabase
                    .from('usuarios')
                    .select('nombre, apellidos, correo, id_usuario')
                    .eq('id_usuario', alumno.id_alumno)
                    .single();

                return { ...alumno, ...usuario };
            })
        );

        res.status(200).json(alumnosConUsuarios);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error en la consulta' });
    }
});



/* Asignar alumno a una autoescuela */

router.post('/alumno/agregar/:correo/:id_autoescuela', async (req, res) => {
    const { correo, id_autoescuela } = req.params;

    try {
        // Obtener id_usuario a partir del correo
        const { data: usuarios, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id_usuario, rol')
            .eq('correo', correo)
            .single();

        if (errorUsuario || !usuarios) {
            return res.status(404).json({ error: 'No se ha encontrado ningún usuario con ese correo' });
        }

        const id_alumno = usuarios.id_usuario;


        // Si el usuario tiene rol de profesor, devolver un error
        if (usuarios.rol === 'profesor') {
            return res.status(400).json({ error: 'El correo introducido no pertenece a un alumno' });
        }

        // Buscar si el alumno ya está asociado a una autoescuela
        const { data: alumnos } = await supabase
            .from('alumnos')
            .select('*')
            .eq('id_alumno', id_alumno)
            .not('id_autoescuela', 'is', null);

        if (alumnos.length > 0) {
            return res.status(400).json({ error: 'El alumno ya está asociado a una autoescuela' });
        }

        const { data, error } = await supabase
            .from('alumnos')
            .insert([{ id_alumno: id_alumno, id_autoescuela }]);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'No se ha podido insertar el registro' });
        }

        res.status(201).json({ id_alumno: id_alumno, id_autoescuela });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error en la inserción' });
    }
});




/* Borrar alumno por su id_alumno en las autoescuelas */

router.delete('/alumno/:id_alumno', async (req, res) => {
    const { id_alumno } = req.params;

    try {
        const { error } = await supabase
            .from('alumnos')
            .delete()
            .eq('id_alumno', id_alumno);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error al borrar el alumno' });
        }

        return res.status(200).json({ message: 'Alumno eliminado correctamente' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error al borrar el alumno' });
    }
});



module.exports = router;