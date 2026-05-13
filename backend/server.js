// server.js - Complete Backend for Candidate Availability System
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Database Connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'recruiter_copilot',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Email Configuration (Using Gmail - you can change to SendGrid, AWS SES, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASSWORD // Your Gmail app password
  }
});

// Verify email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

// ========================================
// API ENDPOINTS
// ========================================

// 1. CREATE AVAILABILITY REQUEST
app.post('/api/availability/create', async (req, res) => {
  try {
    const {
      token,
      candidateId,
      candidateName,
      candidateEmail,
      job,
      slots,
      status,
      createdAt
    } = req.body;

    // Validate required fields
    if (!token || !candidateEmail || !slots || slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Calculate expiration (48 hours from creation)
    const expiresAt = new Date(new Date(createdAt).getTime() + 48 * 60 * 60 * 1000);

    // Insert into database
    const query = `
      INSERT INTO availability_requests 
      (token, candidate_id, candidate_name, candidate_email, job_title, slots, status, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      token,
      candidateId,
      candidateName,
      candidateEmail,
      job,
      JSON.stringify(slots),
      status || 'pending',
      createdAt,
      expiresAt
    ];

    const result = await pool.query(query, values);

    console.log('✅ Availability request created:', token);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creating availability request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2. GET AVAILABILITY REQUEST BY TOKEN
app.get('/api/availability/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const query = `
      SELECT 
        candidate_name,
        candidate_email,
        job_title,
        slots,
        status,
        expires_at
      FROM availability_requests
      WHERE token = $1 
        AND status = 'pending'
        AND expires_at > NOW()
    `;

    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Availability request not found or expired'
      });
    }

    const request = result.rows[0];

    res.json({
      candidate: {
        name: request.candidate_name,
        email: request.candidate_email,
        job: request.job_title
      },
      slots: request.slots
    });

  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 3. CONFIRM AVAILABILITY SELECTION
app.post('/api/availability/:token/confirm', async (req, res) => {
  try {
    const { token } = req.params;
    const { selectedSlot, candidateEmail } = req.body;

    if (!selectedSlot) {
      return res.status(400).json({
        success: false,
        error: 'Selected slot is required'
      });
    }

    // Update database
    const query = `
      UPDATE availability_requests
      SET 
        selected_slot = $1,
        status = 'confirmed',
        confirmed_at = NOW()
      WHERE token = $2 
        AND candidate_email = $3
        AND status = 'pending'
      RETURNING *
    `;

    const values = [JSON.stringify(selectedSlot), token, candidateEmail];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Availability request not found or already confirmed'
      });
    }

    const confirmedRequest = result.rows[0];

    console.log('✅ Availability confirmed:', token);

    // TODO: Send calendar invite to both candidate and recruiter
    // TODO: Notify recruiter about confirmation

    res.json({
      success: true,
      data: confirmedRequest
    });

  } catch (error) {
    console.error('❌ Error confirming availability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 4. SEND EMAIL
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email fields'
      });
    }

    const mailOptions = {
      from: `"RippleHire Recruitment" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}
🗄️  Database: ${process.env.DB_NAME || 'recruiter_copilot'}
  `);
});

module.exports = app;
