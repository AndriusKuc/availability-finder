# Availability Finder

A simple web application for coordinating team schedules. Create surveys, share them with your team, and find the best dates for meetings, events, or gatherings.

[![GitHub](https://img.shields.io/github/license/andriuskuc/availability-finder)](https://github.com/andriuskuc/availability-finder/blob/main/LICENSE)

## Features

- **Create Surveys**: Generate unique survey codes for different events
- **Mark Unavailable Dates**: Team members select dates they can't attend
- **Merged Calendar View**: See everyone's availability at a glance with a heat map
- **Find Available Dates**: Automatically find consecutive date ranges that work for everyone
- **Admin Dashboard**: Manage surveys and submissions with password protection

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/andriuskuc/availability-finder.git
cd availability-finder

# Install all dependencies
npm run install:all

# Copy environment file and configure
cp .env.example .env
```

Edit `.env` and set your admin password:

```
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=random-string-here
```

### Development

```bash
# Start both server and client in development mode
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Production Build

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

## Usage

### For Admins

1. Navigate to `/admin` and log in with your password
2. Create a new survey with a descriptive name
3. Share the generated survey link with your team
4. View submissions and use the merged calendar to find optimal dates

### For Team Members

1. Open the survey link shared with you
2. Enter your name
3. Click or drag on the calendar to mark dates you're **NOT** available
4. Submit your availability

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via better-sqlite3)
- **Authentication**: Express sessions

## Project Structure

```
team-availability/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database setup
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   └── ...
├── data/                   # SQLite database storage
└── ...
```

## API Endpoints

### Public

- `GET /api/surveys/:code` - Get survey by code
- `GET /api/surveys/:code/check-name/:name` - Check if name already submitted
- `POST /api/surveys/:code/submit` - Submit availability

### Admin (Protected)

- `GET /api/admin/check-auth` - Check authentication status
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/surveys` - List all surveys
- `POST /api/admin/surveys` - Create survey
- `DELETE /api/admin/surveys/:id` - Delete survey
- `GET /api/admin/surveys/:id/submissions` - Get submissions
- `DELETE /api/admin/surveys/:id/submissions` - Reset all submissions
- `DELETE /api/admin/submissions/:id` - Delete single submission

## Deployment

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your repository
3. Set environment variables in Railway dashboard:
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
   - `CLIENT_URL` (your Railway domain)
4. Deploy

The SQLite database is stored in the `data/` directory and persists across deployments.

### Other Platforms

Works with any Node.js hosting platform. Ensure:
- Node.js 18+ is available
- The `data/` directory is writable and persistent
- Environment variables are configured

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `ADMIN_PASSWORD` | Admin login password | Required |
| `SESSION_SECRET` | Session encryption key | Required |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:5173` |

## License

MIT
