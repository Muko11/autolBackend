const express = require('express');
const path = require('path');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios')
const app = express();

app.use(express.json());
app.use('/api', usuariosRoutes);
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));


// Ruta GET para mostrar el index
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Inicia el servidor web
app.listen(3000, () => console.log('Servidor iniciado en el puerto 3000'));
