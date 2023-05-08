const express = require('express');
const path = require('path');
const cors = require('cors');
const usuarioRoutes = require('./routes/usuarios');
const profesorRoutes = require('./routes/profesores');
const autoescuelaRoutes = require('./routes/autoescuelas');
const alumnoRoutes = require('./routes/alumnos');
const practicaRoutes = require('./routes/practicas');
const session = require('express-session');

const app = express();

app.use(session({
    secret: 'asfsa93GL45GDDJAjsws68654900DIFJDSJdji30',
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());
app.use(cors());
app.use('/autol', usuarioRoutes);
app.use('/autol', profesorRoutes);
app.use('/autol', autoescuelaRoutes);
app.use('/autol', alumnoRoutes);
app.use('/autol', practicaRoutes);
app.use(express.static(path.join(__dirname, 'public')));

// Ruta GET para mostrar el index
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Inicia el servidor web
app.listen(3000, () => console.log('Servidor iniciado en el puerto 3000'));
