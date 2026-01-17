# Local Development Guide

## ✅ Benefits of Local Development
- **Fast iteration**: Changes take seconds, not minutes
- **Immediate feedback**: See errors before deploying
- **Save resources**: No unnecessary OpenShift builds
- **Easy debugging**: Access to logs, database, and all services

## 🚀 Quick Start

### 1. Test Builds Locally (Always do this first!)
```bash
# Test backend compilation
cd backend
npm run build

# Test frontend compilation
cd ../frontend
npm run build
```

### 2. Start Full Application
```bash
cd helpdesk-ticketing-app
docker-compose up -d --build
```

### 3. Access Services
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api/docs
- **MailHog UI** (Email testing): http://localhost:8025
- **PgAdmin** (Database UI): http://localhost:5050
- **Database Direct**: localhost:5433

## 📝 Development Workflow

### Option A: Using Docker Compose (Recommended)
```bash
# 1. Make code changes in backend/ or frontend/

# 2. Rebuild and restart
docker-compose up -d --build

# 3. View logs
docker-compose logs -f api        # Backend logs
docker-compose logs -f frontend   # Frontend logs

# 4. Stop everything when done
docker-compose down
```

### Option B: Local Development Server (Fastest for backend changes)
```bash
# Terminal 1: Start database and services
docker-compose up postgres mailhog

# Terminal 2: Run backend with hot-reload
cd backend
npm run start:dev

# Terminal 3: Run frontend with hot-reload
cd frontend
npm run dev
```

## 🔍 Debugging

### View Container Logs
```bash
docker-compose logs -f            # All services
docker-compose logs -f api        # Just backend
docker-compose logs -f frontend   # Just frontend
```

### Access Database
```bash
# Using PgAdmin: http://localhost:5050
# Credentials: admin@admin.com / admin

# Or command line:
docker exec -it helpdesk-ticketing-app-postgres-1 psql -U helpdesk -d helpdesk
```

### Restart Specific Service
```bash
docker-compose restart api        # Restart backend
docker-compose restart frontend   # Restart frontend
```

## 📦 Deploy to OpenShift (Only after local testing!)

### Step 1: Verify Everything Works Locally
```bash
# Run full test suite
docker-compose up -d --build
# Test the application at http://localhost:8080
# Check all features work
```

### Step 2: Deploy to OpenShift
```bash
# Deploy backend
cd backend
oc start-build api -n chrif0709-dev --from-dir=. --follow

# Deploy frontend
cd ../frontend
oc start-build frontend -n chrif0709-dev --from-dir=. --follow
```

### Step 3: Verify OpenShift Deployment
```bash
oc get pods -n chrif0709-dev
oc logs -f <pod-name>
```

## 🛠️ Database Migrations

### Local Database
```bash
cd backend

# Create migration after schema changes
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset
```

### OpenShift Database
```bash
# Get database pod name
oc get pods -n chrif0709-dev | grep postgres

# Run migrations
oc exec -it <postgres-pod-name> -- psql -U helpdesk -d helpdesk -f migration.sql
```

## 🔄 Workflow Comparison

### ❌ Old Workflow (Inefficient)
```
1. Make code change
2. oc start-build (5-10 min) 
3. Build fails → See error
4. Fix error locally
5. oc start-build again (5-10 min)
6. Repeat...
```

### ✅ New Workflow (Efficient)
```
1. Make code change
2. npm run build (10 seconds)
3. Fix any errors immediately
4. docker-compose up (30 seconds)
5. Test thoroughly locally
6. Deploy to OpenShift once (5-10 min)
```

## 💡 Pro Tips

1. **Always build locally first**: Catch TypeScript errors before deployment
2. **Use hot-reload**: `npm run start:dev` for instant code changes
3. **Check logs frequently**: `docker-compose logs -f` to catch issues early
4. **Test database changes**: Use local database before production migrations
5. **Commit working code**: Only deploy tested, working code to OpenShift

## 🎯 Summary

**Rule of Thumb**: 
- 🏠 **Develop locally** → Fast, iterative, debugging friendly
- ☁️ **Deploy to OpenShift** → Only stable, tested code

This saves time, resources, and frustration! 🚀
