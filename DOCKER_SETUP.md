# Docker Setup Summary

## What Was Created

### 1. Backend Dockerfile (`Backend/Dockerfile`)
- Node.js 20 Alpine image (lightweight)
- Installs dependencies from package.json
- Copies source code into container
- Exposes port 3001
- Runs `npm start` by default (or `npm run dev` via docker-compose override)

### 2. Frontend Dockerfile (`Frontend/Dockerfile`)
- Node.js 20 Alpine image
- Installs dependencies
- Mounts source code for hot reload development
- Exposes port 5173 (Vite dev server)
- Runs `npm run dev` for Vite development server

### 3. docker-compose.yml
Configuration for running both services together:

**Backend Service**:
- Builds from `Backend/Dockerfile`
- Port mapping: 3001:3001
- Environment: Development mode with hot reload
- Health check: Pings `/api/config` endpoint every 10 seconds
- Volume mount: `./Backend/src` for live code changes
- Command override: `npm run dev` for watch mode

**Frontend Service**:
- Builds from `Frontend/Dockerfile`
- Port mapping: 5173:5173 (Vite dev server)
- Depends on: Backend service (waits for health check)
- Volume mount: `./Frontend/src` for live code changes
- CORS configured to allow frontend to access backend

**Networking**:
- Both services on `wettkampf-network` bridge network
- Backend accessible to frontend via hostname `backend`

### 4. docker-run.sh
Convenience script that:
- Checks for Docker and docker-compose installation
- Builds images
- Starts services in detached mode
- Waits for services to be ready
- Displays access URLs and useful commands

### 5. .dockerignore
Excludes unnecessary files from Docker builds:
- node_modules (rebuilt in container)
- .git, README, settings files
- Build artifacts and logs

### 6. DOCKER_README.md
Complete documentation covering:
- Quick start instructions
- Access URLs
- Common docker-compose commands
- Development workflow
- Testing the sorting issue with debug logs
- Environment variable configuration
- Troubleshooting guide
- Production considerations

## How to Use

### Start Everything
```bash
./docker-run.sh
```

### Access the Application
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API: http://localhost:3001/api/config

### View Logs
```bash
docker-compose logs -f          # All logs
docker-compose logs -f backend  # Backend only
docker-compose logs -f frontend # Frontend only
```

### Stop Services
```bash
docker-compose down
```

## Development Features

✅ **Hot Reload**: Changes to `/src` directories automatically reload
✅ **Health Checks**: Backend ready before frontend starts
✅ **Debug Logging**: Console logs visible for both services
✅ **Volume Mounts**: Direct access to source code inside containers
✅ **Network Isolation**: Clean internal networking
✅ **Environment Variables**: Configurable for different scenarios

## Testing the Ranking/Sorting Issue

The Docker setup includes the debug logging we added earlier. When you run the application and test the ranking:

1. Start: `./docker-run.sh`
2. Navigate to http://localhost:5173
3. Log in as admin, go to Finale section
4. Enter points and times for athletes
5. Check console logs:
   ```bash
   docker-compose logs -f backend  # See [RANKING] logs
   ```
6. Open browser dev tools (F12) → Console tab
   - Look for `[FRONTEND]` logs showing received athlete order
   - Look for `[FRONTEND-FINALISTS]` logs showing filtered order

These logs will help identify where the sorting order is being lost.

## Files Structure

```
Wettkampf/
├── Backend/
│   ├── Dockerfile          # Backend container config
│   ├── src/
│   ├── package.json
│   └── ...
├── Frontend/
│   ├── Dockerfile          # Frontend container config
│   ├── src/
│   ├── package.json
│   └── ...
├── docker-compose.yml      # Orchestration config
├── docker-run.sh           # Convenience startup script
├── .dockerignore            # Files to exclude from builds
├── DOCKER_README.md        # Detailed Docker documentation
└── ...
```

## Next Steps for Debugging

1. **Run the Docker setup** to ensure everything builds and starts correctly
2. **Test with sample data** to reproduce the sorting issue
3. **Check console logs** using the debug output we added
4. **Identify the exact point** where sorting order is lost
5. **Fix the issue** in either backend or frontend as needed

The Docker setup makes this much easier because:
- Everything runs in isolated containers
- Console output is easily captured with `docker-compose logs`
- Changes to code automatically reload
- No dependency conflicts with host system
