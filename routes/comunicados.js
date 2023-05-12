const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabase = require('../config');

/* Mostrar comunicados a los profesores según la autoescuela */

router.get('/comunicado/:id_profesor', async (req, res) => {
  const { id_profesor } = req.params;
  const { data: comunicados, error } = await supabase
    .from('comunicados')
    .select('*')
    .eq('id_profesor', id_profesor);

  if (error) {
    res.status(500).json({ error: error.message });
  } else {
    res.status(200).json(comunicados);
  }
});



/* Mostrar comunicados a los alumnos */

router.get('/comunicado/alumnos/:id_autoescuela', async (req, res) => {
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
  const { data: comunicados, error: errorComunicados } = await supabase
    .from('comunicados')
    .select('*')
    .in('id_profesor', idsProfesores);

  if (errorComunicados) {
    console.log(errorComunicados);
    return res.status(500).json({ message: 'Error al obtener los comunicados de los profesores' });
  }

  // Obtener los nombres y apellidos de los profesores a partir de la tabla usuarios
  const comunicadosConProfesor = await Promise.all(comunicados.map(async (comunicado) => {
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('nombre, apellidos')
      .eq('id_usuario', comunicado.id_profesor);

    if (errorUsuario) {
      console.log(errorUsuario);
      return res.status(500).json({ message: 'Error al obtener los nombres y apellidos del profesor del comunicado' });
    }

    return { ...comunicado, profesor: usuario[0] };

  }));

  // Enviar los comunicados encontradas con los nombres y apellidos de los profesores como respuesta
  return res.json(comunicadosConProfesor);
});



/* Crear un comunicado */

router.post('/comunicado/:id_profesor', async (req, res) => {
  try {
    const { id_profesor } = req.params
    const { titulo, mensaje } = req.body

    // Obtenemos la fecha actual
    const fecha = new Date().toISOString()

    // Insertamos el comunicado en la tabla comunicados
    const { data, error } = await supabase
      .from('comunicados')
      .insert({ titulo, mensaje, fecha, id_profesor })

    if (error) {
      throw new Error(error.message)
    }

    res.json({ message: 'Comunicado insertado correctamente', data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})



/* Actualizar comunicado */

router.put("/comunicado/:id_comunicado", async (req, res) => {
  const { id_comunicado } = req.params;
  const { titulo, mensaje } = req.body;
  const fecha = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("comunicados")
      .update({ titulo, mensaje, fecha })
      .eq("id_comunicado", id_comunicado)
      .single();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar el comunicado");
  }
});


/* Borrar comunicado */

router.delete("/comunicado/:id_comunicado", async (req, res) => {
  const { id_comunicado } = req.params;
  try {
    const { data, error } = await supabase
      .from("comunicados")
      .delete()
      .eq("id_comunicado", id_comunicado);

    if (error) throw error;

    res.status(200).json({
      message: `Comunicado con id ${id_comunicado} borrado correctamente`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ha ocurrido un error" });
  }
});




module.exports = router;