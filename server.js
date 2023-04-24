const express = require('express');
const path = require('path');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios');
const profesoresRoutes = require('./routes/profesores');
const app = express();
const secretKey = 'asfsa93GL45GDDJAjsws68654900DIFJDSJdji30';
const session = require('express-session');

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // En true solo funciona con https
}));


app.use(express.json());
app.use('/autol', usuariosRoutes);
app.use('/autol', profesoresRoutes);
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));


// Ruta GET para mostrar el index
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});



// Inicia el servidor web
app.listen(3000, () => console.log('Servidor iniciado en el puerto 3000'));