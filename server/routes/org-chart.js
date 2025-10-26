import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get org chart nodes
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ocn.id, ocn.user_id, ocn.name, ocn.role, ocn.department, ocn.level,
             ocn.parent_id, ocn.position, ocn.color, ocn.shape, ocn.is_expanded,
             ocn.is_approved, ocn.created_at, ocn.updated_at,
             u.email, u.full_name, u.job_title
      FROM org_chart_nodes ocn
      LEFT JOIN users u ON ocn.user_id = u.id
      WHERE ocn.org_id = $1
      ORDER BY ocn.level, ocn.created_at
    `, [req.user.org_id]);

    const nodes = result.rows.map(node => ({
      id: node.id,
      userId: node.user_id,
      name: node.name,
      role: node.role,
      department: node.department,
      level: node.level,
      parentId: node.parent_id,
      position: node.position,
      color: node.color,
      shape: node.shape,
      isExpanded: node.is_expanded,
      isApproved: node.is_approved,
      createdAt: node.created_at,
      updatedAt: node.updated_at,
      email: node.email,
      fullName: node.full_name,
      jobTitle: node.job_title
    }));

    res.json(nodes);
  } catch (error) {
    console.error('Get org chart nodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get org chart node by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ocn.id, ocn.user_id, ocn.name, ocn.role, ocn.department, ocn.level,
             ocn.parent_id, ocn.position, ocn.color, ocn.shape, ocn.is_expanded,
             ocn.is_approved, ocn.created_at, ocn.updated_at,
             u.email, u.full_name, u.job_title
      FROM org_chart_nodes ocn
      LEFT JOIN users u ON ocn.user_id = u.id
      WHERE ocn.id = $1 AND ocn.org_id = $2
    `, [req.params.id, req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Org chart node not found' });
    }

    const node = result.rows[0];
    res.json({
      id: node.id,
      userId: node.user_id,
      name: node.name,
      role: node.role,
      department: node.department,
      level: node.level,
      parentId: node.parent_id,
      position: node.position,
      color: node.color,
      shape: node.shape,
      isExpanded: node.is_expanded,
      isApproved: node.is_approved,
      createdAt: node.created_at,
      updatedAt: node.updated_at,
      email: node.email,
      fullName: node.full_name,
      jobTitle: node.job_title
    });
  } catch (error) {
    console.error('Get org chart node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create org chart node (Admin only)
router.post('/', requireAdmin, [
  body('userId').optional().isUUID(),
  body('name').trim().isLength({ min: 2 }),
  body('role').optional().trim(),
  body('department').optional().trim(),
  body('level').isInt({ min: 1, max: 10 }),
  body('parentId').optional().isUUID(),
  body('position').optional().isObject(),
  body('color').optional().isIn(['blue', 'green', 'purple', 'orange', 'red', 'gray']),
  body('shape').optional().isIn(['rectangle', 'circle', 'diamond'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, name, role, department, level, parentId, position, color, shape } = req.body;

    // If userId is provided, verify the user exists in the organization
    if (userId) {
      const userResult = await db.query(`
        SELECT id FROM users WHERE id = $1 AND org_id = $2
      `, [userId, req.user.org_id]);

      if (userResult.rows.length === 0) {
        return res.status(400).json({ error: 'User not found in organization' });
      }
    }

    // If parentId is provided, verify the parent node exists
    if (parentId) {
      const parentResult = await db.query(`
        SELECT id FROM org_chart_nodes WHERE id = $1 AND org_id = $2
      `, [parentId, req.user.org_id]);

      if (parentResult.rows.length === 0) {
        return res.status(400).json({ error: 'Parent node not found' });
      }
    }

    const result = await db.query(`
      INSERT INTO org_chart_nodes (
        org_id, user_id, name, role, department, level, parent_id, 
        position, color, shape, is_expanded, is_approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, user_id, name, role, department, level, parent_id, 
                position, color, shape, is_expanded, is_approved, created_at
    `, [
      req.user.org_id, userId, name, role, department, level, parentId,
      JSON.stringify(position || { x: 0, y: 0 }), color || 'blue', 
      shape || 'rectangle', true, true
    ]);

    const node = result.rows[0];

    res.status(201).json({
      message: 'Org chart node created successfully',
      node: {
        id: node.id,
        userId: node.user_id,
        name: node.name,
        role: node.role,
        department: node.department,
        level: node.level,
        parentId: node.parent_id,
        position: node.position,
        color: node.color,
        shape: node.shape,
        isExpanded: node.is_expanded,
        isApproved: node.is_approved,
        createdAt: node.created_at
      }
    });
  } catch (error) {
    console.error('Create org chart node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update org chart node (Admin only)
router.put('/:id', requireAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('role').optional().trim(),
  body('department').optional().trim(),
  body('level').optional().isInt({ min: 1, max: 10 }),
  body('parentId').optional().isUUID(),
  body('position').optional().isObject(),
  body('color').optional().isIn(['blue', 'green', 'purple', 'orange', 'red', 'gray']),
  body('shape').optional().isIn(['rectangle', 'circle', 'diamond']),
  body('isExpanded').optional().isBoolean(),
  body('isApproved').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, role, department, level, parentId, position, color, shape, isExpanded, isApproved } = req.body;

    // If parentId is provided, verify the parent node exists
    if (parentId) {
      const parentResult = await db.query(`
        SELECT id FROM org_chart_nodes WHERE id = $1 AND org_id = $2
      `, [parentId, req.user.org_id]);

      if (parentResult.rows.length === 0) {
        return res.status(400).json({ error: 'Parent node not found' });
      }
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (role) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (department) {
      updateFields.push(`department = $${paramCount++}`);
      values.push(department);
    }
    if (level) {
      updateFields.push(`level = $${paramCount++}`);
      values.push(level);
    }
    if (parentId !== undefined) {
      updateFields.push(`parent_id = $${paramCount++}`);
      values.push(parentId);
    }
    if (position) {
      updateFields.push(`position = $${paramCount++}`);
      values.push(JSON.stringify(position));
    }
    if (color) {
      updateFields.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (shape) {
      updateFields.push(`shape = $${paramCount++}`);
      values.push(shape);
    }
    if (typeof isExpanded === 'boolean') {
      updateFields.push(`is_expanded = $${paramCount++}`);
      values.push(isExpanded);
    }
    if (typeof isApproved === 'boolean') {
      updateFields.push(`is_approved = $${paramCount++}`);
      values.push(isApproved);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id, req.user.org_id);

    const query = `
      UPDATE org_chart_nodes 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND org_id = $${paramCount + 1}
      RETURNING id, user_id, name, role, department, level, parent_id, 
                position, color, shape, is_expanded, is_approved, updated_at
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Org chart node not found' });
    }

    const node = result.rows[0];

    res.json({
      message: 'Org chart node updated successfully',
      node: {
        id: node.id,
        userId: node.user_id,
        name: node.name,
        role: node.role,
        department: node.department,
        level: node.level,
        parentId: node.parent_id,
        position: node.position,
        color: node.color,
        shape: node.shape,
        isExpanded: node.is_expanded,
        isApproved: node.is_approved,
        updatedAt: node.updated_at
      }
    });
  } catch (error) {
    console.error('Update org chart node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete org chart node (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Check if node has children
    const childrenResult = await db.query(`
      SELECT COUNT(*) as count FROM org_chart_nodes 
      WHERE parent_id = $1 AND org_id = $2
    `, [req.params.id, req.user.org_id]);

    if (parseInt(childrenResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete node with children. Please delete children first.' 
      });
    }

    const result = await db.query(`
      DELETE FROM org_chart_nodes 
      WHERE id = $1 AND org_id = $2
      RETURNING id, name
    `, [req.params.id, req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Org chart node not found' });
    }

    res.json({
      message: 'Org chart node deleted successfully',
      node: {
        id: result.rows[0].id,
        name: result.rows[0].name
      }
    });
  } catch (error) {
    console.error('Delete org chart node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Move org chart node (Admin only)
router.patch('/:id/move', requireAdmin, [
  body('newParentId').optional().isUUID(),
  body('newLevel').isInt({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newParentId, newLevel } = req.body;

    // If newParentId is provided, verify the parent node exists
    if (newParentId) {
      const parentResult = await db.query(`
        SELECT id FROM org_chart_nodes WHERE id = $1 AND org_id = $2
      `, [newParentId, req.user.org_id]);

      if (parentResult.rows.length === 0) {
        return res.status(400).json({ error: 'Parent node not found' });
      }
    }

    const result = await db.query(`
      UPDATE org_chart_nodes 
      SET parent_id = $1, level = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND org_id = $4
      RETURNING id, name, level, parent_id, updated_at
    `, [newParentId, newLevel, req.params.id, req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Org chart node not found' });
    }

    const node = result.rows[0];

    res.json({
      message: 'Org chart node moved successfully',
      node: {
        id: node.id,
        name: node.name,
        level: node.level,
        parentId: node.parent_id,
        updatedAt: node.updated_at
      }
    });
  } catch (error) {
    console.error('Move org chart node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
