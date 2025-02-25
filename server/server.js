const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.port || 3000;
let usuariosConectados = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
  console.log("Página principal solicitada");
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Un nuevo usuario se ha conectado.');

  socket.on("archivo_subido", (datosArchivo) => {
    let hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    io.emit("archivoRecibido", { ...datosArchivo, hora });
  });

  socket.on('nombre', (usuario) => {
    socket.usuario = usuario;

    // Agregar el usuario a la lista
    usuariosConectados.push(usuario);

    // Notificar a todos los clientes
    io.emit('nuevaConexion', usuario);
    io.emit('actualizarUsuarios', usuariosConectados);
  });

  socket.on('mensaje', (datos) => {
    let hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    io.emit("holaServidor", { ...datos, hora });
  });

  socket.on('imagen', (datos) => {
    io.emit("enviarImagen", datos);
  });

  socket.on('disconnect', () => {
    if (socket.usuario) {
      usuariosConectados = usuariosConectados.filter(user => user.nombre !== socket.usuario.nombre);
      io.emit('desconexion', socket.usuario);
      io.emit('actualizarUsuarios', usuariosConectados);
    }
    console.log(`Usuario desconectado, quedan ${usuariosConectados.length} conectados.`);
  });

  socket.on("escribiendo", (usuario) => {
    socket.broadcast.emit("escribiendo", usuario);
  });

  socket.on("dejoDeEscribir", (usuario) => {
    socket.broadcast.emit("dejoDeEscribir", usuario);
  });
});

server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
