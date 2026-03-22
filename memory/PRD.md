# AI Founder Copilot - Product Requirements Document

## Original Problem Statement
Build an AI Founder Copilot — Execution Engine (PWA) with Thinkly Labs-style UI. Comprehensive SaaS dashboard with stats, recent plans, progress tracker, templates, resources, and **collaboration features for task assignment and progress monitoring**.

## What's Been Implemented (March 2026)

### Landing Page (Thinkly Labs Style)
- Floating pill navbar with Sign in / Get Started
- Teal gradient hero section
- Testimonials with avatar cards
- Features section with 4 cards
- How It Works section
- CTA section + Footer

### Auth Modal
- Login/Signup tabs
- Google OAuth button (simulated)
- Email/Password fields
- Form validation

### Dashboard Home (Premium SaaS)
1. **Top Bar** - Page title, notification bell, "+ New Plan" button
2. **Stats Cards** (4 cards):
   - Plans Generated: 24 (+12%)
   - This Week: 7 (+3)
   - Tasks Completed: (dynamic count)
   - Overdue Tasks: (dynamic count with badge)
3. **Deadline Alerts Banner** (NEW - March 22, 2026):
   - 🔴 "X tasks overdue" (red, clickable)
   - 🟠 "X task(s) due today" (orange, clickable)
   - 🟡 "X task(s) due tomorrow" (yellow, clickable)
   - Click navigates to Collaboration page
4. **Quick Actions** - 4 workflow buttons
5. **Two-Column Layout**:
   - Recent Plans (with progress bars, view/delete actions)
   - Team Tasks (circular progress, overdue alert, manage tasks link)
6. **Industry Templates** - SaaS, E-commerce, Agency, Marketplace
7. **Resources Preview** - 2 resource cards

### Enhanced Sidebar
- Search bar
- **Main**: Dashboard, Generate Plan, History, Templates
- **Workspace**: Team, Collaboration (with overdue badge), Progress, Resources
- **Account**: Settings
- Upgrade to Pro card
- User profile with logout

### Team Management Page (NEW - March 22, 2026)
- Team stats header (Member count, Assigned Tasks)
- Add Member button with modal
- Team member cards with:
  - Avatar with initials and color
  - Name, role, email
  - Completed/pending task counts
  - Remove button on hover
- "Add Team Member" placeholder card

### Collaboration Page (NEW - March 22, 2026)
- **Toolbar**:
  - Filter dropdowns (Assignee, Status, Priority)
  - View toggle (Kanban/Table)
  - Add Task button
- **Overdue Banner** - Shows count of overdue tasks
- **Kanban Board** (4 columns with **Drag-and-Drop**):
  - To Do (gray)
  - In Progress (blue)
  - Done (green)
  - Delayed (red)
  - **Drag tasks between columns to update status automatically**
  - Visual feedback: card lifts and rotates, drop zone highlights
  - Toast notification on successful move
- **Task Cards**:
  - Checkbox for completion
  - Title with strikethrough when done
  - Priority badge (High/Medium/Low with colors)
  - Status badge
  - **Due status badges** (NEW - color-coded):
    - 🔴 "Overdue" (red) - past due date
    - 🟠 "Due Today" (orange)
    - 🟡 "Tomorrow" (yellow)
  - Card background tints based on due status
  - Due date
  - Assignee avatar with name
  - Comments toggle with count
  - Comment list and add comment input
  - Delete button on hover
- **Table View**:
  - 8 columns (checkbox, task, assignee, status, priority, due, comments, actions)
  - Row highlighting for overdue
  - Sortable headers
- **Add Task Modal**:
  - Description input
  - Assignee dropdown
  - Due date picker
  - Priority selector (High/Medium/Low buttons)

### Generate Plan Page
- Large input textarea
- "What would you like to execute?" header
- Press Enter hint
- Generate Plan button
- Output with Copy/Export/Share buttons
- Smart actions: Regenerate, Make aggressive, Reduce budget, Save Plan

### Templates Page
- 4 Industry template cards with icons
- Custom Templates section with Create button

### Progress Tracker Page
- Stats: Completed, Remaining, Progress %, Overdue (danger highlight)
- Large progress bar
- All Tasks list with assignee avatars and overdue tags
- Add Task button

### Resource Hub Page
- 4 Resource cards (YC Library, Metrics 101, Fundraising, Discord)
- Browse by Category tags

### History Page
- Filter buttons (All, Completed, In Progress)
- Search bar
- Plan list with progress

### Settings Page
- Profile section (Name, Email)
- Preferences with toggles
- Danger Zone (Delete Account)

### AI Integration
- OpenAI GPT-5.2 via Emergent LLM Key
- Structured JSON responses
- Retry logic (3 attempts)
- 60-second timeout

### Guardrails
- Topic-restricted to startup/business
- Returns: "Out of scope. This assistant only handles startup execution and strategy."

### Test Results (March 22, 2026)
- Backend: 100% (6/6 tests passed)
- Frontend: 100% (21/21 features verified)
- Overall: 100%

## Tech Stack
- Frontend: React + Tailwind CSS + Framer Motion
- Backend: FastAPI + Python
- AI: OpenAI GPT-5.2 (Emergent integrations)
- Database: MongoDB (not yet integrated for tasks/teams)
- Icons: Phosphor Icons
- Fonts: Plus Jakarta Sans, Inter

## Current State Notes
- Team members and tasks are stored in React state (useState), NOT persisted to database
- Initial mock data: 3 team members (John Doe, Sarah Kim, Mike Chen), 7 tasks with various statuses

## Next Tasks (P1)
1. **Database Persistence** - Connect tasks and team members to MongoDB
2. **Real Google OAuth** - Replace simulated login with actual authentication
3. **PDF Export** - Add actual PDF generation for execution plans
4. **Real Notifications** - Implement notification system for task updates

## Future Tasks (P2)
- Team member roles/permissions
- Task assignment from generated plans
- Notification system for deadlines
- Activity feed/audit log
- Multiple workspaces
