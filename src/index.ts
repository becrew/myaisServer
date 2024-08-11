import express from 'express';
import path from 'path';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import aisRoutes from './routes/aisRoutes';
import shapeRoutes from './routes/shapeRoutes';
import connectDB from './config/database';
import CombinedAisData from './models/combinedAisData';
import Shape from './models/shapeZone';
import { delay } from './utils/delay';

// Inisialisasi Express
const app = express();

// Konfigurasi CORS
const corsOptions = {
  origin: 'http://localhost:4200', // Izinkan permintaan dari Angular dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization','my-custom-header']
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', aisRoutes);
app.use('/api', shapeRoutes);
// Connect to database
connectDB().catch(err => console.error('Failed to connect to DB', err));

// Inisialisasi server HTTP dan socket.io
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:4200', // Izinkan WebSocket dari Angular dev server
    methods: ['GET', 'POST']
  }
});

// Event handler untuk koneksi socket.io
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Set up MongoDB change streams
const aisChangeStream = CombinedAisData.watch();
aisChangeStream.on('change', (change) => {
  if (['insert', 'update'].includes(change.operationType)) {
    io.emit('aisDataUpdate', change.fullDocument);
  }
});

const shapeChangeStream = Shape.watch();
shapeChangeStream.on('change', (change) => {
    if (['insert', 'update'].includes(change.operationType)) {
    io.emit('shapeDataUpdate', change.fullDocument);
  }
});

// Error Handling
app.use((req, res, next) => {
  res.status(404).send("Route not found");
});



export { io };
export default app;
