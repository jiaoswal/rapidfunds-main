import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { requireApprover } from '../middleware/auth.js';

const router = express.Router();

// Get all funding requests for the organization
router.get('/', async (req, res) => {
  try {
    const { status, requester_id, approver_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT fr.id, fr.title, fr.description, fr.amount, fr.currency, fr.category,
             fr.status, fr.priority, fr.due_date, fr.created_at, fr.updated_at,
             fr.approved_at, fr.rejected_at, fr.metadata,
             requester.email as requester_email, requester.full_name as requester_name,
             approver.email as approver_email, approver.full_name as approver_name
      FROM funding_requests fr
      LEFT JOIN users requester ON fr.requester_id = requester.id
      LEFT JOIN users approver ON fr.approver_id = approver.id
      WHERE fr.org_id = $1
    `;
    
    const values = [req.user.org_id];
    let paramCount = 1;

    if (status) {
      query += ` AND fr.status = $${++paramCount}`;
      values.push(status);
    }
    if (requester_id) {
      query += ` AND fr.requester_id = $${++paramCount}`;
      values.push(requester_id);
    }
    if (approver_id) {
      query += ` AND fr.approver_id = $${++paramCount}`;
      values.push(approver_id);
    }

    query += ` ORDER BY fr.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, values);

    const requests = result.rows.map(req => ({
      id: req.id,
      title: req.title,
      description: req.description,
      amount: parseFloat(req.amount),
      currency: req.currency,
      category: req.category,
      status: req.status,
      priority: req.priority,
      dueDate: req.due_date,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      approvedAt: req.approved_at,
      rejectedAt: req.rejected_at,
      metadata: req.metadata,
      requester: {
        email: req.requester_email,
        name: req.requester_name
      },
      approver: req.approver_email ? {
        email: req.approver_email,
        name: req.approver_name
      } : null
    }));

    res.json(requests);
  } catch (error) {
    console.error('Get funding requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get funding request by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT fr.id, fr.title, fr.description, fr.amount, fr.currency, fr.category,
             fr.status, fr.priority, fr.due_date, fr.created_at, fr.updated_at,
             fr.approved_at, fr.rejected_at, fr.metadata,
             requester.id as requester_id, requester.email as requester_email, 
             requester.full_name as requester_name, requester.department as requester_department,
             approver.id as approver_id, approver.email as approver_email, 
             approver.full_name as approver_name
      FROM funding_requests fr
      LEFT JOIN users requester ON fr.requester_id = requester.id
      LEFT JOIN users approver ON fr.approver_id = approver.id
      WHERE fr.id = $1 AND fr.org_id = $2
    `, [req.params.id, req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding request not found' });
    }

    const reqData = result.rows[0];
    res.json({
      id: reqData.id,
      title: reqData.title,
      description: reqData.description,
      amount: parseFloat(reqData.amount),
      currency: reqData.currency,
      category: reqData.category,
      status: reqData.status,
      priority: reqData.priority,
      dueDate: reqData.due_date,
      createdAt: reqData.created_at,
      updatedAt: reqData.updated_at,
      approvedAt: reqData.approved_at,
      rejectedAt: reqData.rejected_at,
      metadata: reqData.metadata,
      requester: {
        id: reqData.requester_id,
        email: reqData.requester_email,
        name: reqData.requester_name,
        department: reqData.requester_department
      },
      approver: reqData.approver_id ? {
        id: reqData.approver_id,
        email: reqData.approver_email,
        name: reqData.approver_name
      } : null
    });
  } catch (error) {
    console.error('Get funding request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new funding request
router.post('/', [
  body('title').trim().isLength({ min: 3 }),
  body('description').trim().isLength({ min: 10 }),
  body('amount').isFloat({ min: 0.01 }),
  body('category').optional().trim(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('dueDate').optional().isISO8601(),
  body('approverId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, amount, category, priority = 'Medium', dueDate, approverId, metadata } = req.body;

    // If approverId is provided, verify they exist and can approve
    if (approverId) {
      const approverResult = await db.query(`
        SELECT id, role FROM users 
        WHERE id = $1 AND org_id = $2 AND role IN ('Admin', 'Approver') AND is_active = true
      `, [approverId, req.user.org_id]);

      if (approverResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid approver selected' });
      }
    }

    const result = await db.query(`
      INSERT INTO funding_requests (
        org_id, requester_id, approver_id, title, description, amount, 
        currency, category, priority, due_date, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, title, description, amount, currency, category, status, priority, due_date, created_at
    `, [
      req.user.org_id, req.user.id, approverId, title, description, amount,
      'INR', category, priority, dueDate, JSON.stringify(metadata || {})
    ]);

    const request = result.rows[0];

    res.status(201).json({
      message: 'Funding request created successfully',
      request: {
        id: request.id,
        title: request.title,
        description: request.description,
        amount: parseFloat(request.amount),
        currency: request.currency,
        category: request.category,
        status: request.status,
        priority: request.priority,
        dueDate: request.due_date,
        createdAt: request.created_at
      }
    });
  } catch (error) {
    console.error('Create funding request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update funding request
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 3 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('category').optional().trim(),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('dueDate').optional().isISO8601(),
  body('approverId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, amount, category, priority, dueDate, approverId, metadata } = req.body;

    // Check if request exists and user has permission to update
    const existingRequest = await db.query(`
      SELECT requester_id, status FROM funding_requests 
      WHERE id = $1 AND org_id = $2
    `, [req.params.id, req.user.org_id]);

    if (existingRequest.rows.length === 0) {
      return res.status(404).json({ error: 'Funding request not found' });
    }

    const request = existingRequest.rows[0];
    
    // Only requester can update their own request, or admin can update any
    if (request.requester_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Can't update approved or rejected requests
    if (['Approved', 'Rejected'].includes(request.status)) {
      return res.status(400).json({ error: 'Cannot update approved or rejected requests' });
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (amount) {
      updateFields.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (category) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (priority) {
      updateFields.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (dueDate) {
      updateFields.push(`due_date = $${paramCount++}`);
      values.push(dueDate);
    }
    if (approverId) {
      updateFields.push(`approver_id = $${paramCount++}`);
      values.push(approverId);
    }
    if (metadata) {
      updateFields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(metadata));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const query = `
      UPDATE funding_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, description, amount, currency, category, status, priority, due_date, updated_at
    `;

    const result = await db.query(query, values);
    const updatedRequest = result.rows[0];

    res.json({
      message: 'Funding request updated successfully',
      request: {
        id: updatedRequest.id,
        title: updatedRequest.title,
        description: updatedRequest.description,
        amount: parseFloat(updatedRequest.amount),
        currency: updatedRequest.currency,
        category: updatedRequest.category,
        status: updatedRequest.status,
        priority: updatedRequest.priority,
        dueDate: updatedRequest.due_date,
        updatedAt: updatedRequest.updated_at
      }
    });
  } catch (error) {
    console.error('Update funding request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve funding request (Approver only)
router.patch('/:id/approve', requireApprover, [
  body('comments').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { comments } = req.body;

    const result = await db.query(`
      UPDATE funding_requests 
      SET status = 'Approved', approver_id = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND org_id = $3 AND status = 'Open'
      RETURNING id, title, amount, approved_at
    `, [req.user.id, req.params.id, req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding request not found or already processed' });
    }

    const request = result.rows[0];

    // Add approval comment if provided
    if (comments) {
      await db.query(`
        INSERT INTO query_messages (request_id, user_id, message_type, content)
        VALUES ($1, $2, $3, $4)
      `, [req.params.id, req.user.id, 'approval', comments]);
    }

    res.json({
      message: 'Funding request approved successfully',
      request: {
        id: request.id,
        title: request.title,
        amount: parseFloat(request.amount),
        approvedAt: request.approved_at
      }
    });
  } catch (error) {
    console.error('Approve funding request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject funding request (Approver only)
router.patch('/:id/reject', requireApprover, [
  body('comments').trim().isLength({ min: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { comments } = req.body;

    const result = await db.query(`
      UPDATE funding_requests 
      SET status = 'Rejected', approver_id = $1, rejected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND org_id = $3 AND status = 'Open'
      RETURNING id, title, amount, rejected_at
    `, [req.user.id, req.params.id, req.user.org_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funding request not found or already processed' });
    }

    const request = result.rows[0];

    // Add rejection comment
    await db.query(`
      INSERT INTO query_messages (request_id, user_id, message_type, content)
      VALUES ($1, $2, $3, $4)
    `, [req.params.id, req.user.id, 'rejection', comments]);

    res.json({
      message: 'Funding request rejected',
      request: {
        id: request.id,
        title: request.title,
        amount: parseFloat(request.amount),
        rejectedAt: request.rejected_at
      }
    });
  } catch (error) {
    console.error('Reject funding request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete funding request
router.delete('/:id', async (req, res) => {
  try {
    // Check if request exists and user has permission to delete
    const existingRequest = await db.query(`
      SELECT requester_id FROM funding_requests 
      WHERE id = $1 AND org_id = $2
    `, [req.params.id, req.user.org_id]);

    if (existingRequest.rows.length === 0) {
      return res.status(404).json({ error: 'Funding request not found' });
    }

    const request = existingRequest.rows[0];
    
    // Only requester can delete their own request, or admin can delete any
    if (request.requester_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await db.query('DELETE FROM funding_requests WHERE id = $1', [req.params.id]);

    res.json({ message: 'Funding request deleted successfully' });
  } catch (error) {
    console.error('Delete funding request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
