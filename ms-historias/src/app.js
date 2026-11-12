// =====================================================================
// Configuración de la aplicación Express.
// Aquí se registran los middlewares, las rutas y el manejo de errores.
// =====================================================================

const historiasRoutes = require('./routes/historias.routes');
const express = require('express');
const cors = require('cors');
const app = express();


app.use(cors());

app.use(express.json());

// Registro en la terminal: una línea por petición con su código de respuesta y duración
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - inicio} ms)`);
  });
  next();
});


app.get('/health', (req, res) => {
  res.json({ servicio: 'ms-historias', estado: 'ok' });
});


app.use('/historias', historiasRoutes);


app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message, detalles: err.detalles });
});

module.exports = app;
