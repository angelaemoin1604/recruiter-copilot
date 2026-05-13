-- database.sql - PostgreSQL Database Schema

-- Create database (run this first)
-- CREATE DATABASE recruiter_copilot;

-- Connect to the database
-- \c recruiter_copilot;

-- Create availability_requests table
CREATE TABLE IF NOT EXISTS availability_requests (
  id SERIAL PRIMARY KEY,
  token VARCHAR(100) UNIQUE NOT NULL,
  candidate_id VARCHAR(50) NOT NULL,
  candidate_name VARCHAR(255) NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  slots JSONB NOT NULL,
  selected_slot JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Indexes for performance
  CONSTRAINT chk_status CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled'))
);

-- Create indexes
CREATE INDEX idx_availability_token ON availability_requests(token);
CREATE INDEX idx_availability_status ON availability_requests(status);
CREATE INDEX idx_availability_expires_at ON availability_requests(expires_at);
CREATE INDEX idx_availability_candidate_email ON availability_requests(candidate_email);

-- Function to automatically expire old requests
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE availability_requests
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to run this function periodically
-- Or call it from your application periodically

-- Sample query to view all requests
-- SELECT 
--   id,
--   token,
--   candidate_name,
--   candidate_email,
--   job_title,
--   status,
--   created_at,
--   expires_at
-- FROM availability_requests
-- ORDER BY created_at DESC;

-- Query to view confirmed requests
-- SELECT 
--   candidate_name,
--   candidate_email,
--   job_title,
--   selected_slot,
--   confirmed_at
-- FROM availability_requests
-- WHERE status = 'confirmed'
-- ORDER BY confirmed_at DESC;
