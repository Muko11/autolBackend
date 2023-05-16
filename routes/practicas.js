const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');

/* Mostrar prácticas a los profesores según la autoescuela */

router.get('/practica/:id_profesor', async (req, res) => {
  const { id_profesor } = req.params;
  const { data: practicas, error } = await supabase
    .from('practicas')
    .select('*')
    .eq('id_profesor', id_profesor);

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(200).json(practicas);
  }
});


/* Mostrar nombre y apellidos del alumno en las practicas */

router.get('/practica/nombre/apellidos/:id_alumno', async (req, res) => {
  const { id_alumno } = req.params;
  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('nombre, apellidos')
    .eq('id_usuario', id_alumno);

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(200).json(usuarios);
  }
});


/* Mostrar practicas a los alumnos */

router.get('/practica/alumnos/:id_autoescuela', async (req, res) => {
  const { id_autoescuela } = req.params;

  // Obtener los ID de los profesores que pertenecen a la autoescuela
  const { data: profesores, error: errorProfesores } = await supabase
    .from('profesores')
    .select('id_profesor')
    .eq('id_autoescuela', id_autoescuela);

  if (errorProfesores) {
    console.log(errorProfesores);
    return res.status(500).json({ message: 'Error al obtener los profesores de la autoescuela' });
  }

  const idsProfesores = profesores.map((profesor) => profesor.id_profesor);

  // Obtener todas las prácticas de los profesores de la autoescuela
  const { data: practicas, error: errorPracticas } = await supabase
    .from('practicas')
    .select('*')
    .in('id_profesor', idsProfesores);

  if (errorPracticas) {
    console.log(errorPracticas);
    return res.status(500).json({ message: 'Error al obtener las prácticas de los profesores' });
  }

  // Obtener los nombres y apellidos de los profesores a partir de la tabla usuarios
  const practicasConProfesor = await Promise.all(practicas.map(async (practica) => {
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('nombre, apellidos')
      .eq('id_usuario', practica.id_profesor);

    if (errorUsuario) {
      console.log(errorUsuario);
      return res.status(500).json({ message: 'Error al obtener los nombres y apellidos del profesor de la práctica' });
    }

    return { ...practica, profesor: usuario[0] };

  }));

  // Enviar las prácticas encontradas con los nombres y apellidos de los profesores como respuesta
  return res.json(practicasConProfesor);
});



/* Historial de practicas por id_alumno */

router.get('/practica/historial/:id_alumno', async (req, res) => {
  const { id_alumno } = req.params;

  try {
    // Buscar las prácticas correspondientes en la tabla practicas
    const { data: practicas, error: errorPracticas } = await supabase
      .from('practicas')
      .select('*')
      .eq('id_alumno', id_alumno);

    if (errorPracticas) {
      console.log(errorPracticas);
      return res.status(500).json({ message: 'Error al buscar las prácticas en la base de datos' });
    }

    // Obtener el nombre y apellidos del profesor de cada práctica
    const promesasUsuarios = practicas.map(practica =>
      supabase
        .from('usuarios')
        .select('nombre, apellidos')
        .eq('id_usuario', practica.id_profesor)
        .single()
    );
    const usuarios = await Promise.all(promesasUsuarios);

    // Asociar el nombre y apellidos del profesor con cada práctica
    const practicasConUsuarios = practicas.map((practica, i) => ({
      ...practica,
      profesor: usuarios[i],
    }));

    return res.json(practicasConUsuarios);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error al buscar las prácticas en la base de datos' });
  }
});


/* Crear practica con id_alumno en null */

router.post('/practica/:id_profesor', async (req, res) => {
  const { id_profesor } = req.params;
  const { fecha, hora, tipo } = req.body;

  // Verificar si ya existe un registro con los mismos valores
  const { data: existentData, error: existentError } = await supabase
    .from('practicas')
    .select()
    .eq('id_profesor', id_profesor)
    .eq('fecha', fecha)
    .eq('hora', hora);

  if (existentError) {
    return res.status(500).json({ error: existentError.message });
  }

  if (existentData.length > 0) {
    // Ya existe un registro con los mismos valores, no se realiza la inserción
    return res.status(409).json({ message: 'Ya existe una práctica con esos valores' });
  }

  // No existe un registro con los mismos valores, se realiza la inserción
  const { data, error } = await supabase
    .from('practicas')
    .insert({ id_profesor, id_alumno: null, fecha, hora, tipo });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ data });
});


/* router.post('/practica/:id_profesor', async (req, res) => {
  const { id_profesor } = req.params;
  const { fecha, hora, tipo } = req.body;

  const { data, error } = await supabase
    .from('practicas')
    .insert({ id_profesor, id_alumno: null, fecha, hora, tipo });

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(201).json({ data });
  }
}); */




/* Actualizar practica */

router.put("/practica/:id_practica", async (req, res) => {
  const { id_practica } = req.params;
  const { fecha, hora, tipo } = req.body;

  try {
    const { data, error } = await supabase
      .from("practicas")
      .update({ fecha, hora, tipo })
      .eq("id_practica", id_practica)
      .single();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar la práctica");
  }
});

/* router.put("/practica/:id_practica", async (req, res) => {
  const { id_practica } = req.params;
  const { fecha, hora, tipo } = req.body;

  try {
    // Verificar si ya existe una práctica con los mismos valores
    const { data: existentData, error: existentError } = await supabase
      .from("practicas")
      .select()
      .eq("id_practica", id_practica);

    if (existentError) {
      return res.status(500).json({ error: existentError.message });
    }

    if (existentData.length === 0) {
      // No existe una práctica con ese id, devolver error
      return res.status(404).json({ error: "No existe una práctica con ese ID" });
    }

    const existentPractica = existentData[0];
    const { id_profesor: existentIdProfesor, fecha: existentFecha, hora: existentHora, tipo: existentTipo } = existentPractica;

    if (existentIdProfesor === id_practica && existentFecha === fecha && existentHora === hora) {
      // Solo actualizar el campo 'tipo'
      const { data, error } = await supabase
        .from("practicas")
        .update({ tipo })
        .eq("id_practica", id_practica)
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    }

    // Verificar si ya existe una práctica con los mismos id_profesor, fecha y hora
    const { data: duplicateData, error: duplicateError } = await supabase
      .from("practicas")
      .select()
      .eq("id_profesor", existentIdProfesor)
      .eq("fecha", fecha)
      .eq("hora", hora);

    if (duplicateError) {
      return res.status(500).json({ error: duplicateError.message });
    }

    if (duplicateData.length > 0) {
      // Ya existe una práctica con esos valores, devolver error
      return res.status(409).json({ error: "Ya existe una práctica con esos valores" });
    }

    // Los valores son distintos y no existen duplicados, se realiza la actualización completa
    const { data, error } = await supabase
      .from("practicas")
      .update({ fecha, hora, tipo })
      .eq("id_practica", id_practica)
      .single();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar la práctica");
  }
}); */




/* Actualizar el NULL del id_alumno cuando reserve una practica */

router.put('/practica/alumno/:id_profesor/:fecha/:hora/:id_alumno', async (req, res) => {
  const { id_profesor, fecha, hora, id_alumno } = req.params;

  // Buscar la práctica correspondiente en la tabla practicas
  const { data: practica, error: errorPractica } = await supabase
    .from('practicas')
    .select('*')
    .eq('id_profesor', id_profesor)
    .eq('fecha', fecha)
    .eq('hora', hora)
    .limit(1);

  if (errorPractica) {
    console.log(errorPractica);
    return res.status(500).json({ message: 'Error al buscar la práctica en la base de datos' });
  }

  if (!practica || practica.length === 0) {
    return res.status(404).json({ message: 'No se encontró la práctica solicitada' });
  }

  // Actualizar el id_alumno en la tabla practicas
  const { data, error } = await supabase
    .from('practicas')
    .update({ id_alumno: id_alumno })
    .eq('id_profesor', id_profesor)
    .eq('fecha', fecha)
    .eq('hora', hora);

  if (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error al actualizar la práctica' });
  }

  return res.json({ message: 'Práctica actualizada correctamente' });
});



/* Cancelar reserva estableciendo de nuevo a NULL el id_alumno */

router.put('/practica/cancelar/:id_profesor/:fecha/:hora/:id_alumno', async (req, res) => {
  const { id_profesor, fecha, hora, id_alumno } = req.params;

  // Actualizar el campo id_alumno a NULL en la tabla practicas
  const { data, error } = await supabase
    .from('practicas')
    .update({ id_alumno: null })
    .eq('id_profesor', id_profesor)
    .eq('fecha', fecha)
    .eq('hora', hora)
    .eq('id_alumno', id_alumno);

  if (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error al actualizar la práctica en la base de datos' });
  }

  return res.json({ message: 'Práctica actualizada correctamente' });
});



/* Borrar practica por su id_profesor en las practicas */

router.delete('/practica/:id_profesor/:fecha/:hora', async (req, res) => {
  const { id_profesor, fecha, hora } = req.params;

  try {
    const { error } = await supabase
      .from('practicas')
      .delete()
      .eq('id_profesor', id_profesor)
      .eq('fecha', fecha)
      .eq('hora', hora);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al borrar la práctica' });
    }

    return res.status(200).json({ message: 'Práctica eliminada correctamente' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error al borrar la práctica' });
  }
});






module.exports = router;