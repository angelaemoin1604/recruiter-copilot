# Recruiter Copilot Backend - Complete Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

---

## 🚀 STEP 1: Install PostgreSQL

### Windows:
1. Download from https://www.postgresql.org/download/windows/
2. Run installer and follow wizard
3. Remember your password for postgres user
4. Default port: 5432

### Mac:
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## 🗄️ STEP 2: Create Database

Open PostgreSQL command line (psql):

```bash
# Windows: Open "SQL Shell (psql)" from Start Menu
# Mac/Linux: 
psql -U postgres
```

Then run:

```sql
CREATE DATABASE recruiter_copilot;
\c recruiter_copilot
```

Copy and paste the contents of `database.sql` to create the table.

Or run directly:
```bash
psql -U postgres -d recruiter_copilot -f database.sql
```

---

## 📦 STEP 3: Install Dependencies

Navigate to the backend folder and install packages:

```bash
cd backend
npm install
```

This will install:
- express (Web framework)
- cors (Cross-origin resource sharing)
- pg (PostgreSQL client)
- nodemailer (Email sending)
- dotenv (Environment variables)
- nodemon (Auto-reload during development)

---

## ⚙️ STEP 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` file with your settings:

```env
PORT=3001

# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=recruiter_copilot
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App URL
APP_URL=http://localhost:5173
```

---

## 📧 STEP 5: Set Up Gmail for Sending Emails

### Option A: Using Gmail App Password (Recommended)

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords**: https://myaccount.google.com/apppasswords
5. Select app: **Mail**
6. Select device: **Other (Custom name)**
7. Enter name: **Recruiter Copilot**
8. Click **Generate**
9. Copy the 16-character password
10. Paste it in `.env` as `EMAIL_PASSWORD`

### Option B: Using SendGrid (Alternative)

If you prefer SendGrid:

1. Sign up at https://sendgrid.com/
2. Get your API key
3. Install SendGrid package:
```bash
npm install @sendgrid/mail
```
4. Modify `server.js` to use SendGrid instead of nodemailer

---

## 🔧 STEP 6: Update Frontend to Use Backend

In your frontend `utils.js`, replace the mock version with the real API version:

```javascript
export const sendAvailabilityEmail = async (candidate, slots) => {
  try {
    const token = generateUniqueToken();
    
    // Store in database
    const createResponse = await fetch('http://localhost:3001/api/availability/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        job: candidate.job,
        slots: slots,
        status: 'pending',
        createdAt: new Date().toISOString()
      })
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create availability request');
    }

    // Generate email content
    const emailContent = generateAvailabilityRequestEmail(candidate, slots, token);

    // Send email
    const emailResponse = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: candidate.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      })
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    return {
      success: true,
      confirmationUrl: emailContent.confirmationUrl
    };

  } catch (error) {
    console.error('Error sending availability email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

Also update `CandidateConfirmAvailability.jsx`:

```javascript
// Replace localStorage with API call
const response = await fetch(`http://localhost:3001/api/availability/${availabilityToken}`);
if (!response.ok) {
  throw new Error('Failed to fetch availability');
}
const data = await response.json();
```

And the confirm function:

```javascript
const response = await fetch(`http://localhost:3001/api/availability/${availabilityToken}/confirm`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    selectedSlot: selectedSlot,
    candidateEmail: candidateInfo.email
  })
});
```

---

## ▶️ STEP 7: Start the Backend Server

### Development mode (auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

You should see:
```
🚀 Server running on port 3001
📧 Email service: Configured
🗄️  Database: recruiter_copilot
```

---

## 🧪 STEP 8: Test the Backend

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-05-12T..."}
```

### Test 2: Create Availability Request
```bash
curl -X POST http://localhost:3001/api/availability/create \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_123",
    "candidateId": "CAND001",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "job": "Software Engineer",
    "slots": [{"date":"2026-05-21","start":"10:00","end":"19:00","display":"10:00 AM - 7:00 PM"}],
    "status": "pending",
    "createdAt": "2024-05-12T10:00:00Z"
  }'
```

### Test 3: Get Availability Request
```bash
curl http://localhost:3001/api/availability/test_123
```

---

## 📁 Project Structure

```
backend/
├── server.js              # Main server file
├── database.sql          # Database schema
├── package.json          # Dependencies
├── .env                  # Environment variables (create this)
├── .env.example         # Example env file
└── README.md            # This file
```

---

## 🔍 Troubleshooting

### Database Connection Error
```
Error: password authentication failed for user "postgres"
```
**Fix:** Check your DB_PASSWORD in `.env`

### Email Sending Error
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Fix:** Make sure you're using an App Password, not your regular Gmail password

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Fix:** Change PORT in `.env` or kill the process using that port

### CORS Error in Browser
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:** Make sure the backend is running and CORS is enabled (already done in server.js)

---

## 🚀 Deployment

### Deploying to Heroku:

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create Heroku app:
```bash
heroku create your-app-name
```

3. Add PostgreSQL:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. Set environment variables:
```bash
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set APP_URL=https://your-frontend-url.com
```

5. Deploy:
```bash
git push heroku main
```

### Deploying to Railway:

1. Go to https://railway.app/
2. Click "Start a New Project"
3. Select "Deploy from GitHub"
4. Add PostgreSQL database
5. Set environment variables in Railway dashboard
6. Deploy automatically on push

---

## 📊 Database Queries

### View all requests:
```sql
SELECT * FROM availability_requests ORDER BY created_at DESC;
```

### View confirmed requests:
```sql
SELECT candidate_name, candidate_email, job_title, selected_slot, confirmed_at 
FROM availability_requests 
WHERE status = 'confirmed';
```

### Manually expire old requests:
```sql
UPDATE availability_requests 
SET status = 'expired' 
WHERE status = 'pending' AND expires_at < NOW();
```

---

## ✅ Checklist

- [ ] PostgreSQL installed
- [ ] Database created
- [ ] Table created (ran database.sql)
- [ ] Dependencies installed (npm install)
- [ ] .env file created and configured
- [ ] Gmail App Password generated
- [ ] Backend server starts without errors
- [ ] Health check endpoint works
- [ ] Frontend updated to use backend APIs
- [ ] Test email sent successfully
- [ ] Availability request created in database
- [ ] Candidate confirmation page loads from database

---

## 🎉 You're Done!

Your backend is now fully functional! The system can:
✅ Store availability requests in database
✅ Send real emails to candidates
✅ Handle confirmation submissions
✅ Track request status
✅ Auto-expire old requests

Need help? Check the troubleshooting section or open an issue!
