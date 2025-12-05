import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import transaksiRoutes from './routes/transaksiRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import masterRoutes from './routes/masterRoutes';
import fiscalRoutes from './routes/fiscalRoutes';
import subscriberRoutes from './routes/subscriberRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.body ? `- Body: ${JSON.stringify(req.body)}` : '');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: 'Connected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/fiscal', fiscalRoutes);
app.use('/api/subscriber', subscriberRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('=================================');
  });
}).catch(err => {
  console.error('❌ Failed to connect DB', err);
  process.exit(1);
});


