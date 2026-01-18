# Local Testing Guide (No Docker/OpenShift)

## Prerequisites

Make sure you have these installed on your machine:
- ✅ Node.js (v18 or higher)
- ✅ PostgreSQL (running locally)
- ✅ npm or yarn

---

## Step 1: Set Up PostgreSQL Database

### Option A: Using PostgreSQL GUI (pgAdmin, DBeaver, etc.)
1. Open your PostgreSQL client
2. Create a new database named `helpdesk_db`
3. Note your PostgreSQL connection details:
   - Host: `localhost`
   - Port: `5432` (default)
   - Database: `helpdesk_db`
   - Username: `postgres` (or your username)
   - Password: Your PostgreSQL password

### Option B: Using PostgreSQL Command Line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE helpdesk_db;

# Exit
\q
```

---

## Step 2: Set Up Backend

### 1. Navigate to backend directory
```bash
cd helpdesk-ticketing-app/backend
```

### 2. Install dependencies (if not already done)
```bash
npm install
```

### 3. Create `.env` file
Create a file named `.env` in the `backend/` directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/helpdesk_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Configuration (Optional - for MailHog local testing)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@helpdesk.local"

# Optional: Staff notification email
STAFF_NOTIFY_EMAIL="admin@helpdesk.local"

# Server Port
PORT=3000
```

**Important:** Replace `YOUR_PASSWORD` with your actual PostgreSQL password!

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This will create all the necessary tables in your database.

### 6. (Optional) Seed Database with Test Data
Create a test admin user manually or use Prisma Studio:
```bash
npx prisma studio
```

Then create a user with:
- Email: `admin@test.com`
- Password: `password123` (will be hashed)
- Role: `ADMIN`
- firstName: `Admin`
- lastName: `User`

### 7. Start the Backend Server
```bash
npm run start:dev
```

The backend should now be running on `http://localhost:3000`

**Verify it's working:**
- Open browser: `http://localhost:3000/api/docs`
- You should see Swagger API documentation

---

## Step 3: Set Up Mailer Worker (Optional)

The mailer worker is optional for basic testing, but if you want email functionality:

### 1. Install MailHog (for local email testing)

**Windows:**
```bash
# Download from https://github.com/mailhog/MailHog/releases
# Run MailHog.exe
```

**Mac:**
```bash
brew install mailhog
mailhog
```

**Linux:**
```bash
# Download binary from https://github.com/mailhog/MailHog/releases
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
chmod +x MailHog_linux_amd64
./MailHog_linux_amd64
```

MailHog will run on:
- SMTP Server: `localhost:1025`
- Web UI: `http://localhost:8025`

### 2. Start Mailer Worker
```bash
cd helpdesk-ticketing-app/mailer
npm install
npm run start:dev
```

**To view emails:** Open `http://localhost:8025` in your browser

---

## Step 4: Set Up Frontend

### 1. Navigate to frontend directory
```bash
cd helpdesk-ticketing-app/frontend
```

### 2. Install dependencies (if not already done)
```bash
npm install
```

### 3. Create `.env` file (Optional)
Create a file named `.env` in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000
```

If you don't create this file, it defaults to `http://localhost:3000` anyway.

### 4. Start the Frontend Development Server
```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

---

## Step 5: Test the Application

### 1. Open your browser
Navigate to: `http://localhost:5173`

### 2. Create an account
1. Click "Sign Up"
2. Fill in the form:
   - Email: `test@example.com`
   - Password: `password123`
   - First Name: `Test`
   - Last Name: `User`
3. Click "Sign Up"

**Note:** The first user will be created as AGENT by default. You'll need to manually change them to ADMIN in the database.

### 3. Set user as ADMIN (using Prisma Studio)
```bash
# In the backend directory
cd helpdesk-ticketing-app/backend
npx prisma studio
```

1. Open Prisma Studio (opens in browser automatically)
2. Go to "User" table
3. Find your user
4. Change `role` from `AGENT` to `ADMIN`
5. Click "Save"

### 4. Login
1. Go back to `http://localhost:5173`
2. Login with your credentials
3. You should be redirected to `/tickets`

### 5. Test Features

**Test Dark Mode:**
- Click the sun/moon icon in the navbar
- Toggle between Light/Dark/System themes

**Test Ticket Creation:**
1. Click "Create New Ticket"
2. Fill in title and description
3. Click "Create Ticket"

**Test Ticket Assignment (Admin only):**
1. Create another user account (will be AGENT)
2. As admin, assign a ticket to the agent
3. Logout and login as the agent
4. Go to "My Inbox" - should see the assigned ticket

**Test Manage Users (Admin only):**
1. Click "Manage Users" in navbar
2. View all users
3. Change a user's role using the dropdown

---

## Quick Start Commands (TL;DR)

### Terminal 1 - Backend
```bash
cd helpdesk-ticketing-app/backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### Terminal 2 - Frontend
```bash
cd helpdesk-ticketing-app/frontend
npm install
npm run dev
```

### Terminal 3 - Mailer (Optional)
```bash
cd helpdesk-ticketing-app/mailer
npm install
npm run start:dev
```

### Terminal 4 - MailHog (Optional)
```bash
mailhog
# Or just run the MailHog executable
```

---

## Troubleshooting

### Backend won't start
**Error:** "Can't reach database server"
- ✅ Make sure PostgreSQL is running
- ✅ Check your DATABASE_URL in `.env`
- ✅ Verify PostgreSQL credentials

**Error:** "Port 3000 is already in use"
- ✅ Change PORT in `.env` to something else (e.g., 3001)
- ✅ Update VITE_API_URL in frontend `.env` accordingly

### Frontend won't connect to backend
**Error:** "Failed to fetch"
- ✅ Make sure backend is running on port 3000
- ✅ Check browser console for CORS errors
- ✅ Verify VITE_API_URL points to correct backend URL

### Database migrations fail
**Error:** "Can't create migration"
- ✅ Delete `prisma/migrations` folder
- ✅ Run `npx prisma migrate dev --name init` again
- ✅ Or use `npx prisma db push` to sync schema directly

### Can't see emails
**Error:** "Email not sending"
- ✅ Make sure MailHog is running on port 1025
- ✅ Check mailer worker logs for errors
- ✅ Open MailHog web UI at `http://localhost:8025`

### Prisma Studio won't open
- ✅ Try different port: `npx prisma studio --port 5556`
- ✅ Check if port 5555 is already in use

---

## Environment Variables Reference

### Backend `.env`
```env
# Required
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/helpdesk_db"
JWT_SECRET="your-secret-key-at-least-32-characters-long"
PORT=3000

# Optional (for email)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@helpdesk.local"
STAFF_NOTIFY_EMAIL="admin@helpdesk.local"
```

### Frontend `.env`
```env
# Optional (defaults to http://localhost:3000)
VITE_API_URL=http://localhost:3000
```

### Mailer `.env`
```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/helpdesk_db"
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@helpdesk.local"
```

---

## URLs to Bookmark

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api/docs
- **Prisma Studio:** http://localhost:5555 (when running)
- **MailHog UI:** http://localhost:8025 (when running)

---

## Creating Test Data

### Using Prisma Studio
```bash
cd helpdesk-ticketing-app/backend
npx prisma studio
```

Then manually create:
1. **Users:** Create 2-3 users with different roles (ADMIN, AGENT)
2. **Tickets:** Create some test tickets
3. **Assign tickets:** Set assignedToUserId on tickets

### Using API (via Swagger)
1. Open http://localhost:3000/api/docs
2. POST /auth/signup - Create users
3. POST /auth/login - Get JWT token
4. Click "Authorize" button, paste token
5. POST /tickets - Create tickets
6. PATCH /tickets/:id/assign - Assign tickets (admin only)

---

## Stopping Everything

1. Press `Ctrl+C` in each terminal running a service
2. PostgreSQL can keep running (or stop it via Services on Windows)
3. MailHog can keep running (or close the window)

---

## Need Help?

### Check Logs
- **Backend logs:** In the terminal where you ran `npm run start:dev`
- **Frontend logs:** Browser console (F12)
- **Database:** Prisma Studio or your PostgreSQL client
- **Emails:** MailHog UI

### Common Issues
1. **Can't login:** Check if user exists in database (Prisma Studio)
2. **Ticket permission error:** Make sure backend has the GET /tickets/:id endpoint
3. **Theme not working:** Clear browser cache and localStorage
4. **Dark mode not persisting:** Check browser localStorage for "helpdesk-theme"

---

**Happy Testing! 🚀**

Last Updated: 2026-01-17
