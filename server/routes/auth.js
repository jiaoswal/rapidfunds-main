import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('orgCode').trim().isLength({ min: 3 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, orgCode, role = 'Member', department, jobTitle } = req.body;

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Find or create organization
    let orgResult = await db.query('SELECT id FROM organizations WHERE org_code = $1', [orgCode]);
    let orgId;

    if (orgResult.rows.length === 0) {
      // Create new organization
      const newOrgResult = await db.query(`
        INSERT INTO organizations (name, org_code)
        VALUES ($1, $2)
        RETURNING id
      `, [`${orgCode} Organization`, orgCode]);
      orgId = newOrgResult.rows[0].id;
    } else {
      orgId = orgResult.rows[0].id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await db.query(`
      INSERT INTO users (org_id, email, password_hash, full_name, role, department, job_title, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, full_name, role, org_id
    `, [orgId, email, hashedPassword, fullName, role, department, jobTitle, true, true]);

    const user = userResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, orgId: user.org_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        orgId: user.org_id
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const userResult = await db.query(`
      SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.org_id, u.is_active,
             o.name as org_name, o.org_code
      FROM users u
      JOIN organizations o ON u.org_id = o.id
      WHERE u.email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, orgId: user.org_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        orgId: user.org_id,
        orgName: user.org_name,
        orgCode: user.org_code
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const userResult = await db.query(`
      SELECT u.id, u.email, u.full_name, u.role, u.department, u.job_title, u.phone,
             u.created_at, u.last_login, u.preferences,
             o.name as org_name, o.org_code
      FROM users u
      JOIN organizations o ON u.org_id = o.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      department: user.department,
      jobTitle: user.job_title,
      phone: user.phone,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      preferences: user.preferences,
      orgName: user.org_name,
      orgCode: user.org_code
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', [
  body('fullName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('department').optional().trim(),
  body('jobTitle').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, department, jobTitle, preferences } = req.body;
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (fullName) {
      updateFields.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    if (phone) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (department) {
      updateFields.push(`department = $${paramCount++}`);
      values.push(department);
    }
    if (jobTitle) {
      updateFields.push(`job_title = $${paramCount++}`);
      values.push(jobTitle);
    }
    if (preferences) {
      updateFields.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(preferences));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, role, department, job_title, phone, preferences
    `;

    const result = await db.query(query, values);
    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
        jobTitle: user.job_title,
        phone: user.phone,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
