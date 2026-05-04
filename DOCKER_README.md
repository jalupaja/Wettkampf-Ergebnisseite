# Docker Setup for Wettkampf

This directory contains Docker configuration for running Wettkampf in containers.

## Quick Start

### Option 1: Using the provided script (Recommended)

```bash
./docker-run.sh
```

This will:
- Build Docker images for backend and frontend
- Start containers in development mode
- Display access URLs and useful commands

### Option 2: Using docker-compose directly

```bash
docker-compose up --build
```

## Access

Once running, access the application at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Config Endpoint**: http://localhost:3001/api/config

## Files

- `Backend/Dockerfile` - Backend container image
- `Frontend/Dockerfile` - Frontend container image (dev mode with hot reload)
- `docker-compose.yml` - Orchestration configuration
- `docker-run.sh` - Convenience script to build and start services

## Features

- **Hot Reload**: Source code changes automatically reload in both services
- **Volume Mounts**: Both `src/` directories are mounted for live development
- **Service Health Checks**: Backend health check ensures it's ready before frontend starts
- **Network Isolation**: Services communicate via internal Docker network
- **Debug Logging**: All console output visible via `docker-compose logs`

## Common Commands

### View logs

```bash
docker-compose logs -f
```

### View backend logs only

```bash
docker-compose logs -f backend
```

### View frontend logs only

```bash
docker-compose logs -f frontend
```

### Stop services

```bash
docker-compose down
```

### Stop and remove all data

```bash
docker-compose down -v
```

### Rebuild images (after dependencies change)

```bash
docker-compose build --no-cache
```

### Execute a command in a running container

```bash
docker-compose exec backend npm run dev
```

## Development Workflow

1. **Start the stack**:
   ```bash
   ./docker-run.sh
   ```

2. **Make code changes** - They automatically reload thanks to volume mounts

3. **View console logs** - Open another terminal and run:
   ```bash
   docker-compose logs -f
   ```

4. **Test the application**:
   - Frontend: http://localhost:5173
   - Check backend API: http://localhost:3001/api/config

## Testing the Sorting Issue

To test the athlete ranking and time-based sorting:

1. Start the application with `./docker-run.sh`
2. Navigate to http://localhost:5173
3. Log in as admin
4. Go to the Finale section
5. Enter points and times for multiple athletes
6. Check browser console (F12) for debug logs showing athlete order
7. Check server logs: `docker-compose logs -f backend`

Debug output shows:
- `[RANKING]` - Backend sorting order after ranking calculation
- `[FRONTEND]` - Frontend received athlete order from API
- `[FRONTEND-FINALISTS]` - Finalist filtering order

These logs help trace where the sorting order might be lost.

## Environment Variables

Both services can be configured via environment variables in `docker-compose.yml`:

**Backend**:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGINS` - Allowed CORS origins

**Frontend**:
- `VITE_API_URL` - Backend API URL (used by frontend in some contexts)

## Troubleshooting

### Port already in use

If ports 5173 or 3001 are in use:

```bash
# Find what's using the port (e.g., 3001)
lsof -i :3001

# Kill the process
kill -9 <PID>
```

Or change ports in `docker-compose.yml`:

```yaml
ports:
  - "3002:3001"  # Use 3002 externally, 3001 internally
```

### Services not communicating

Check that both services are on the same network:

```bash
docker network inspect wettkampf-network
```

### Backend unhealthy

Check backend logs:

```bash
docker-compose logs backend
```

## Production Considerations

This setup is configured for **development** with:
- Volume mounts for hot reload
- Development dependencies installed
- Verbose logging enabled

For production deployment:
- Create separate production Dockerfiles (using multi-stage builds)
- Remove volume mounts
- Minimize image sizes
- Use environment-specific configurations
- Implement proper logging/monitoring
