# Climbing Cup Project Prompt

Build a climbing competition management system with Svelte 5 frontend and Express backend.

## Tech Stack
- Frontend: Svelte 5, Vite, TypeScript
- Backend: Express, JWT, cookie-parser

## Requirements

### Authentication
- Password-only login
- JWT in HTTP-only cookie
- Admin creates users with password

### User Roles
- **admin**: Manage everything, no start class
- **athlete**: Has a start class, can log routes

### Start Classes (Categories)
- Admin creates/edits/deletes start classes in admin panel
- NOT hardcoded in frontend
- Examples: Jugend m, Jugend w, Damen, Herren

### Routes
- Admin creates/edits routes in admin panel
- Route has: name, category (qualification/bonus/final), difficulty (points)
- Athletes mark routes as completed
- Qualification: select best X routes for scoring (configurable)

### Results
- Leaderboard by start class
- Auto-refresh

### UI
- German language
- Dark mode with localStorage
- Orange/green color scheme (Kletterzentrum Regensburg)

## Running
```bash
./run.sh
# or
cd Backend && node src/server.js
npm run dev
```

## API Endpoints (key ones)
- POST /api/login, POST /api/logout
- GET/POST/PUT/DELETE /api/Users (admin)
- GET/POST /api/Routes
- GET/POST /api/Finale (admin)
- GET /api/Groups (start classes)
- GET/POST/PUT/DELETE /api/admin/Groups (admin manages start classes)
- GET /api/admin/Routes (admin manages routes)