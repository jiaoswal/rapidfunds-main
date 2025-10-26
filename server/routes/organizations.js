import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get organization details
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, org_code, created_at, updated_at, settings
      FROM organizations 
      WHERE id = $1
    `, [req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = result.rows[0];
    res.json({
      id: org.id,
      name: org.name,
      orgCode: org.org_code,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      settings: org.settings
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update organization settings (Admin only)
router.put('/', requireAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('settings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, settings } = req.body;
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (settings) {
      updateFields.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(settings));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.org_id);

    const query = `
      UPDATE organizations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, org_code, settings, updated_at
    `;

    const result = await db.query(query, values);
    const org = result.rows[0];

    res.json({
      message: 'Organization updated successfully',
      organization: {
        id: org.id,
        name: org.name,
        orgCode: org.org_code,
        settings: org.settings,
        updatedAt: org.updated_at
      }
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization statistics (Admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total users
      db.query('SELECT COUNT(*) as count FROM users WHERE org_id = $1', [req.user.org_id]),
      // Active users
      db.query('SELECT COUNT(*) as count FROM users WHERE org_id = $1 AND is_active = true', [req.user.org_id]),
      // Total funding requests
      db.query('SELECT COUNT(*) as count FROM funding_requests WHERE org_id = $1', [req.user.org_id]),
      // Pending requests
      db.query('SELECT COUNT(*) as count FROM funding_requests WHERE org_id = $1 AND status = $2', [req.user.org_id, 'Open']),
      // Approved requests
      db.query('SELECT COUNT(*) as count FROM funding_requests WHERE org_id = $1 AND status = $2', [req.user.org_id, 'Approved']),
      // Total amount requested
      db.query('SELECT COALESCE(SUM(amount), 0) as total FROM funding_requests WHERE org_id = $1', [req.user.org_id]),
      // Total amount approved
      db.query('SELECT COALESCE(SUM(amount), 0) as total FROM funding_requests WHERE org_id = $1 AND status = $2', [req.user.org_id, 'Approved'])
    ]);

    res.json({
      totalUsers: parseInt(stats[0].rows[0].count),
      activeUsers: parseInt(stats[1].rows[0].count),
      totalRequests: parseInt(stats[2].rows[0].count),
      pendingRequests: parseInt(stats[3].rows[0].count),
      approvedRequests: parseInt(stats[4].rows[0].count),
      totalAmountRequested: parseFloat(stats[5].rows[0].total),
      totalAmountApproved: parseFloat(stats[6].rows[0].total)
    });
  } catch (error) {
    console.error('Get organization stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization members
router.get('/members', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.full_name, u.role, u.department, u.job_title, u.phone,
             u.is_active, u.created_at, u.last_login
      FROM users u
      WHERE u.org_id = $1
      ORDER BY u.created_at DESC
    `, [req.user.org_id]);

    const members = result.rows.map(user => ({
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

    res.json(members);
  } catch (error) {
    console.error('Get organization members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
