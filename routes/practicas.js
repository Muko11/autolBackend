const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');

/* Mostrar prácticas según la autoescuela */

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



/* Crear practica con id_alumno en null */

router.post('/practica/:id_profesor', async (req, res) => {
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
});




/* Actualizar practica */

router.put('/practica/:id_profesor/:fecha/:hora', async (req, res) => {
  const { id_profesor, fecha, hora } = req.params;
  const { tipo, nuevaFecha, nuevaHora } = req.body;

  try {
    const { error } = await supabase
      .from('practicas')
      .update({ tipo, fecha: nuevaFecha, hora: nuevaHora })
      .eq('id_profesor', id_profesor)
      .eq('fecha', fecha)
      .eq('hora', hora);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al actualizar la práctica' });
    }

    return res.status(200).json({ message: 'Práctica actualizada correctamente' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error al actualizar la práctica' });
  }
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