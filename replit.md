# RapidFunds - Internal Funding Approval System

## Project Overview
RapidFunds is a professional funding approval dashboard built with React, Express, and PostgreSQL. It enables organizations to manage internal funding requests with approval workflows, organizational charts, and admin customization.

## Current Implementation Status

### ✅ Completed Features

#### Multi-Level Approval Workflows (NEW)
- **Category with "Other" option**: Funding requests can select from predefined categories or specify a custom category
- **Multi-level approval chains**: Configurable approval workflows with multiple levels (Level 1 → Level 2 → Final)
- **Automatic forwarding**: Requests automatically advance to next approval level after approval
- **Approval chain configuration**: Admins can create and manage approval chains per department/category
- **Approval history timeline**: Complete audit trail of all approval actions with timestamps, levels, and comments
- **Admin fast-track approval**: Admins can bypass multi-level workflows to approve/reject immediately
- **Status tracking**: Enhanced status values including Open, Needs Info, Approved, Rejected, Closed

#### Authentication & User Management
- **Simplified login flow**: Email + password only (no orgCode required after signup)
- **Secure multi-tenant isolation**: Global, case-insensitive email uniqueness
- User registration with role selection (Admin, Approver, Requester) requires orgCode
- Session management with passport.js
- Protected routes with role-based access control
- Organization creation wizard with secure setup flow and auto-login
- Secure invite token system with role/expiry tracking and revocation
- **Email normalization**: All emails stored in lowercase with case-insensitive lookup

#### Database Schema
- Complete PostgreSQL database with Drizzle ORM
- Tables: organizations, users, fundingRequests, queryMessages, orgChartNodes, inviteTokens, approvalChains, approvalHistory
- **Updated Schema (2025-10-14)**:
  - `organizations`: Added `domain`, `approvalRules`, `defaultDigestTime`
  - `users`: Added `jobTitle`, `phoneNumber`, `digestTime`, `notificationPreferences`, `isOnline`
  - `fundingRequests`: Added `customCategory`, `currentApprovalLevel`, `approvalChainId`, `participants`, `slaDeadline`, `lastActivityAt`; status values: Open, Needs Info, Approved, Rejected, Closed
  - `queryMessages` (formerly requestComments): Renamed and enhanced with `messageType`, `attachments` for chat-style messaging
  - `approvalChains`: NEW - Stores multi-level approval workflows with department/category filtering
  - `approvalHistory`: NEW - Complete audit log of all approval actions with timestamps and comments
- Proper relationships and foreign keys
- Database seeding with demo organization (orgCode: "DEMO")
- Secure invite token table with role, expiry, and usage tracking

#### Frontend Components
- **Splash Screen**: Entry point with RapidFunds logo and "tap anywhere" message
- Professional UI with Shadcn components
- Blue-green color theme with dark mode support
- Responsive sidebar navigation (hidden on splash/onboarding routes)
- Global bottom navigation footer (visible only after login)
- Dashboard with statistics cards
- Create request page with category dropdown (including "Other" option), Level 1 approver selection, checklist support, and file attachments
- Approvals page with status filtering (Open/Approved/Rejected), approval history timeline, and admin fast-track controls
- Org chart page with hierarchical view
- Admin settings with four tabs:
  - Branding: Logo upload, organization name, custom colors
  - Custom Fields: Dynamic onboarding fields
  - Approval Chains: Multi-level workflow configuration with department/category filtering
  - Invite Links: Secure token generation with role/expiry management

#### API Endpoints
- `/api/register`, `/api/login`, `/api/logout`, `/api/user` - Authentication
- `/api/organizations/create` - Create new organization with admin account
- `/api/organization` - Get/update organization settings
- `/api/requests` - CRUD operations for funding requests
- `/api/requests/:id/status` - Update request status with multi-level approval logic and fast-track support
- `/api/requests/:id/messages` - Get/add messages (formerly comments, now supports chat)
- `/api/requests/:id/approval-history` - Get complete approval audit trail
- `/api/approval-chains` - CRUD for multi-level approval workflows (admin-only)
- `/api/org-chart` - CRUD operations for org chart nodes
- `/api/approvers` - Get list of approvers
- `/api/upload/logo` - Admin-only logo upload to .public directory
- `/api/upload/:requestId` - Upload request attachments to .private directory
- `/api/files/:fileId` - Download uploaded files
- `/api/invite-tokens` - CRUD for secure invite tokens (admin-only)

### 🚧 Known Limitations & Future Enhancements

#### File Upload System
- File upload UI exists but not yet wired to object storage
- Need to implement file upload handling for request attachments
- Object storage already provisioned and ready to use

#### AI Summary Feature
- Placeholder shown in UI for AI-generated summaries
- Can be implemented with OpenAI API in future phase

#### Org Chart Visualization
- Current implementation shows hierarchical list view
- Drag-and-drop visual canvas planned for future enhancement
- Node positioning data structure already in place


## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Wouter (routing), TanStack Query
- **Backend**: Express.js, TypeScript, Passport.js, PostgreSQL
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom session-based auth with orgCode validation
- **Styling**: Tailwind CSS with custom design tokens

## Getting Started

### Demo Organization
- **Organization Code**: `DEMO`
- Use this code to register new test users

### Creating a New Organization
1. Navigate to `/create-org` from the auth page
2. Generate a unique organization code (auto-generated)
3. Enter organization name and admin account details
4. System creates organization and logs in admin automatically
5. Admin can then invite users via secure invite links

### User Roles
1. **Admin**: Full access to all features, manage settings, org chart, approve requests
2. **Approver**: Can approve/reject funding requests assigned to them
3. **Requester**: Can create and view own funding requests

### Key User Flows
1. **First Visit**: Splash Screen (tap anywhere) → Auth Page (Login/Sign Up)
2. **Create Organization**: Auth Page → Create Organization → Generate code → Fill details → Auto login
3. **Invite Users**: Admin Settings → Invite Links → Select role/expiry → Generate link → Share
4. **Registration**: Use invite link OR enter orgCode → Fill details → Select role → Create account (orgCode required for signup only)
5. **Login Flow**: Splash Screen → Auth Page → Login with email + password → Dashboard (no orgCode needed!)
6. **Create Request**: Dashboard → Create Request OR click "New Request" button → Fill form → Attach files → Submit
7. **Approve Request**: Dashboard → Approvals → Review → Approve/Reject
8. **Org Chart**: Admin → Org Chart → Add/remove people
9. **Branding**: Admin → Admin Settings → Upload logo → Customize colors → Save

## Design Guidelines
The application follows professional design standards documented in `design_guidelines.md`:
- Clean, minimal dashboard aesthetic
- Blue (#0EA5E9) and Green (#10B981) primary colors
- Consistent spacing and typography (Inter font)
- Status colors: Success (green), Pending (blue), Rejected (red)
- Responsive design with mobile support

## Architecture Notes
- Schema-first development approach
- Database models drive type safety across frontend/backend
- Clean separation of concerns: routes → storage → database
- Stateless authentication with session store
- Role-based access control at API level

## Future Roadmap
1. Visual drag-and-drop org chart canvas
2. AI-powered request summaries with OpenAI
3. Email notifications for approval workflows
4. Analytics dashboard with approval metrics
5. Export functionality for reports (CSV/PDF)

## Development

### Run Database Migrations
```bash
npm run db:push
```

### Seed Database
```bash
npx tsx server/seed.ts
```

### Start Development Server
```bash
npm run dev
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `SESSION_SECRET` - Session encryption key (auto-configured)
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` - Object storage bucket (provisioned)
- `PRIVATE_OBJECT_DIR` - Private objects directory
- `PUBLIC_OBJECT_SEARCH_PATHS` - Public assets paths

---

**Last Updated**: October 14, 2025
**Status**: MVP Core Features Implemented

### Recent Updates (October 14, 2025)
- ✅ **Multi-Level Approval Workflows**: Complete implementation with automatic forwarding through approval levels
- ✅ **Category Management**: Dropdown with "Other" option for custom categories
- ✅ **Approval Chain Configuration**: Admin UI for creating multi-level workflows per department/category
- ✅ **Approval History Timeline**: Complete audit trail with timestamps, levels, and comments
- ✅ **Admin Fast-Track Approval**: Admins can bypass workflows to approve/reject immediately
- ✅ **Status Enhancement**: Updated from "Pending" to "Open" with additional states (Needs Info, Closed)
- ✅ **Simplified Login**: Removed orgCode requirement from login - now just email + password!
- ✅ **Improved UX**: Added "New Request" button on dashboard for quick access
- ✅ **Cleaner Sidebar**: Removed navigation from sidebar (use bottom nav instead)
- ✅ **Security Enhancement**: Implemented global, case-insensitive email uniqueness
- ✅ **Better Onboarding**: Organization creation and signup auto-login users
