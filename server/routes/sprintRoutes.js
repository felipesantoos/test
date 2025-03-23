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
  port: parseInt(process.env.POSTGRES_PORT || '5433'),
});

// Get all sprints
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sprints WHERE deleted_at IS NULL ORDER BY start_date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sprints:', err);
    res.status(500).json({ error: 'Failed to fetch sprints' });
  }
});

// Get sprint by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM sprints WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching sprint:', err);
    res.status(500).json({ error: 'Failed to fetch sprint' });
  }
});

// Create new sprint
router.post('/', async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;
    
    // Validate required fields
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, start date, and end date are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO sprints (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *',
      [name, start_date, end_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating sprint:', err);
    res.status(500).json({ error: 'Failed to create sprint' });
  }
});

// Update sprint
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date } = req.body;
    
    // Validate required fields
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, start date, and end date are required' });
    }
    
    const result = await pool.query(
      'UPDATE sprints SET name = $1, start_date = $2, end_date = $3 WHERE id = $4 AND deleted_at IS NULL RETURNING *',
      [name, start_date, end_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating sprint:', err);
    res.status(500).json({ error: 'Failed to update sprint' });
  }
});

// Soft delete sprint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE sprints SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sprint not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting sprint:', err);
    res.status(500).json({ error: 'Failed to delete sprint' });
  }
});

export default router;