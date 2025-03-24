import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const router = express.Router();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'dit_manager',
  host: process.env.POSTGRES_HOST || 'dit-manager-db',
  database: process.env.POSTGRES_DB || 'dit_manager',
  password: process.env.POSTGRES_PASSWORD || 'dit_manager_password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

// Get all epics
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM epics WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching epics:', err);
    res.status(500).json({ error: 'Failed to fetch epics' });
  }
});

// Get epic by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM epics WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Epic not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching epic:', err);
    res.status(500).json({ error: 'Failed to fetch epic' });
  }
});

// Create new epic
router.post('/', async (req, res) => {
  try {
    const { name, project_id } = req.body;
    
    // Validate required fields
    if (!name || project_id === undefined) {
      return res.status(400).json({ error: 'Name and project_id are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO epics (name, project_id) VALUES ($1, $2) RETURNING *',
      [name, project_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating epic:', err);
    res.status(500).json({ error: 'Failed to create epic' });
  }
});

// Update epic
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, project_id } = req.body;
    
    // Validate required fields
    if (!name || project_id === undefined) {
      return res.status(400).json({ error: 'Name and project_id are required' });
    }
    
    const result = await pool.query(
      'UPDATE epics SET name = $1, project_id = $2 WHERE id = $3 AND deleted_at IS NULL RETURNING *',
      [name, project_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Epic not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating epic:', err);
    res.status(500).json({ error: 'Failed to update epic' });
  }
});

// Soft delete epic
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE epics SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Epic not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting epic:', err);
    res.status(500).json({ error: 'Failed to delete epic' });
  }
});

export default router;
