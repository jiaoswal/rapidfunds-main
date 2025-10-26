# RapidFunds Backend Setup

## 🚀 Quick Start

### Prerequisites
- **PostgreSQL** installed and running
- **Node.js** (v18 or higher)

### Database Setup
1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/
   - Default port: 5432
   - Default user: postgres

2. **Create Database**
   ```sql
   CREATE DATABASE rapidfunds;
   ```

3. **Update Database Credentials** (if needed)
   - Edit `server/config/database.js`
   - Update connection settings if using different credentials

### Installation & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will start both:
   - Backend server on `http://localhost:3001`
   - Frontend on `http://localhost:3000`

3. **Or Start Components Separately**
   ```bash
   # Backend only
   npm run server
   
   # Frontend only  
   npm run client
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users` - Get all users in organization
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/approvers/list` - Get approvers list

### Organizations
- `GET /api/organizations` - Get organization details
- `PUT /api/organizations` - Update organization (Admin only)
- `GET /api/organizations/stats` - Get organization statistics (Admin only)
- `GET /api/organizations/members` - Get organization members

### Funding Requests
- `GET /api/requests` - Get all funding requests
- `GET /api/requests/:id` - Get funding request by ID
- `POST /api/requests` - Create new funding request
- `PUT /api/requests/:id` - Update funding request
- `PATCH /api/requests/:id/approve` - Approve request (Approver only)
- `PATCH /api/requests/:id/reject` - Reject request (Approver only)
- `DELETE /api/requests/:id` - Delete funding request

### Org Chart
- `GET /api/org-chart` - Get org chart nodes
- `GET /api/org-chart/:id` - Get org chart node by ID
- `POST /api/org-chart` - Create org chart node (Admin only)
- `PUT /api/org-chart/:id` - Update org chart node (Admin only)
- `DELETE /api/org-chart/:id` - Delete org chart node (Admin only)
- `PATCH /api/org-chart/:id/move` - Move org chart node (Admin only)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidfunds
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Database Schema
The backend automatically creates these tables:
- `organizations` - Organization details
- `users` - User accounts and profiles
- `funding_requests` - Funding request data
- `org_chart_nodes` - Organizational chart structure
- `query_messages` - Messages and comments

## 🎯 Features

### ✅ Implemented
- **Authentication & Authorization** - JWT-based auth with role-based access
- **User Management** - CRUD operations for users
- **Organization Management** - Multi-tenant organization support
- **Funding Requests** - Complete request lifecycle management
- **Org Chart Management** - Hierarchical organization structure
- **API Security** - Rate limiting, CORS, input validation
- **Database Integration** - PostgreSQL with connection pooling

### 🔄 Migration from IndexedDB
The backend provides a seamless migration path from the current IndexedDB setup:
- All existing data structures are preserved
- API endpoints match the current frontend expectations
- Gradual migration is supported

## 🚨 Troubleshooting

### Database Connection Issues
1. **Check PostgreSQL Status**
   ```bash
   # Windows
   services.msc
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Test Connection**
   ```bash
   psql -h localhost -U postgres -d rapidfunds
   ```

3. **Reset Database** (if needed)
   ```sql
   DROP DATABASE rapidfunds;
   CREATE DATABASE rapidfunds;
   ```

### Port Conflicts
- Backend runs on port 3001
- Frontend runs on port 3000
- Change ports in `package.json` scripts if needed

### Common Issues
- **"Database connection failed"** → Check PostgreSQL is running
- **"Port already in use"** → Kill existing processes or change ports
- **"Permission denied"** → Check database user permissions

## 📈 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure production database
4. Set up SSL certificates
5. Configure reverse proxy (nginx)

### Database Optimization
- Enable connection pooling
- Set up database backups
- Configure read replicas for scaling
- Monitor query performance

## 🎉 Success!

Once everything is running:
- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000
- API Docs: http://localhost:3001/api

Your RapidFunds app now has a **full-stack backend** with PostgreSQL! 🚀
