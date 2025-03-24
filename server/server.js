import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route modules
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import otherRoutes from './routes/otherRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import downloadRoutes from './routes/downloadRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import customFieldRoutes from './routes/customFieldRoutes.js';
import sprintRoutes from './routes/sprintRoutes.js';
import epicRoutes from './routes/epicRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/custom_fields', customFieldRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/epics', epicRoutes);
app.use('/api', otherRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
