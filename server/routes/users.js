import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users in organization
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, full_name, role, department, job_title, phone, 
             is_active, created_at, last_login
      FROM users 
      WHERE org_id = $1
      ORDER BY created_at DESC
    `, [req.user.org_id]);

    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      department: user.department,
      jobTitle: user.job_title,
      phone: user.phone,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, full_name, role, department, job_title, phone, 
             is_active, created_at, last_login, preferences
      FROM users 
      WHERE id = $1 AND org_id = $2
    `, [req.params.id, req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      department: user.department,
      jobTitle: user.job_title,
      phone: user.phone,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin only)
router.post('/', requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('role').isIn(['Admin', 'Approver', 'Finance', 'Member', 'Requester'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, role, department, jobTitle, phone } = req.body;

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(`
      INSERT INTO users (org_id, email, password_hash, full_name, role, department, job_title, phone, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, full_name, role, department, job_title, phone
    `, [req.user.org_id, email, hashedPassword, fullName, role, department, jobTitle, phone, true, true]);

    const user = result.rows[0];

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        jobTitle: user.job_title,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/:id', requireAdmin, [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('role').optional().isIn(['Admin', 'Approver', 'Finance', 'Member', 'Requester']),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, role, department, jobTitle, phone, isActive } = req.body;
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (fullName) {
      updateFields.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    if (role) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (department) {
      updateFields.push(`department = $${paramCount++}`);
      values.push(department);
    }
    if (jobTitle) {
      updateFields.push(`job_title = $${paramCount++}`);
      values.push(jobTitle);
    }
    if (phone) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (typeof isActive === 'boolean') {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id, req.user.org_id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND org_id = $${paramCount + 1}
      RETURNING id, email, full_name, role, department, job_title, phone, is_active
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        jobTitle: user.job_title,
        phone: user.phone,
        isActive: user.is_active
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM users 
      WHERE id = $1 AND org_id = $2 AND id != $3
      RETURNING id, email, full_name
    `, [req.params.id, req.user.org_id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or cannot delete yourself' });
    }

    res.json({
      message: 'User deleted successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get approvers (users who can approve requests)
router.get('/approvers/list', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, email, full_name, role, department, job_title
      FROM users 
      WHERE org_id = $1 AND role IN ('Admin', 'Approver') AND is_active = true
      ORDER BY full_name
    `, [req.user.org_id]);

    const approvers = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      department: user.department,
      jobTitle: user.job_title
    }));

    res.json(approvers);
  } catch (error) {
    console.error('Get approvers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
