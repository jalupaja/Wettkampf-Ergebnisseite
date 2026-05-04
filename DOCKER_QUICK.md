# Docker Quick Reference

## 🚀 Start Everything

```bash
./docker-run.sh
```

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| API Config | http://localhost:3001/api/config |

## 📋 Useful Commands

### View Logs
```bash
docker-compose logs -f                    # All services
docker-compose logs -f backend            # Backend only
docker-compose logs -f frontend           # Frontend only
docker-compose logs -f --tail=50 backend  # Last 50 lines
```

### Start/Stop
```bash
docker-compose up                         # Start in foreground
docker-compose up -d                      # Start in background
docker-compose down                       # Stop all services
docker-compose down -v                    # Stop and remove volumes
docker-compose restart                    # Restart all services
docker-compose restart backend            # Restart one service
```

### Build
```bash
docker-compose build                      # Build all images
docker-compose build --no-cache           # Rebuild without cache
docker-compose build backend              # Build one service
```

### Debug
```bash
docker-compose exec backend sh            # Shell into backend container
docker-compose exec frontend sh           # Shell into frontend container
docker ps                                  # List running containers
docker logs -f <container-id>             # View container logs
```

## 🐛 Testing Ranking/Sorting

1. Start: `./docker-run.sh`
2. Go to: http://localhost:5173
3. Log in as admin
4. Navigate to: Finale section
5. Enter points and times
6. Check debug output:
   ```bash
   docker-compose logs -f backend
   ```
7. Look for:
   - `[RANKING]` - backend sorting
   - `[FRONTEND]` - API received data
   - `[FRONTEND-FINALISTS]` - filtered finalists

## 🔧 Troubleshooting

### Port already in use
```bash
lsof -i :5173  # Find what's using port 5173
kill -9 <PID>   # Kill the process
```

### Services won't start
```bash
docker-compose down -v      # Clean up
docker-compose build --no-cache  # Rebuild
./docker-run.sh             # Start fresh
```

### Backend not responding
```bash
docker-compose logs backend  # Check backend logs
docker-compose restart backend  # Restart backend
```

### Frontend can't reach backend
```bash
docker-compose exec frontend ping backend  # Test connectivity
docker network inspect wettkampf-network   # Check network
```

## 📝 Common Workflows

### Development with hot reload
```bash
./docker-run.sh
# Edit files in Backend/src or Frontend/src
# Changes auto-reload thanks to volume mounts
docker-compose logs -f  # Watch logs
```

### Add dependencies
```bash
# 1. Add to Backend/package.json or Frontend/package.json
# 2. Stop services: docker-compose down
# 3. Rebuild: docker-compose build --no-cache
# 4. Start: ./docker-run.sh
```

### Clean rebuild
```bash
docker-compose down -v           # Remove everything
docker-compose build --no-cache  # Rebuild from scratch
./docker-run.sh                  # Start fresh
```

## 🎯 Key Files

- `Backend/Dockerfile` - Backend container configuration
- `Frontend/Dockerfile` - Frontend container configuration
- `docker-compose.yml` - Services orchestration
- `docker-run.sh` - Quick start script
- `DOCKER_README.md` - Detailed documentation
- `.dockerignore` - Exclude files from builds

## ⚡ Performance Tips

- Use `.dockerignore` to exclude unnecessary files
- Mount volumes only for development (not production)
- Use Alpine images for smaller size
- Clean up unused images: `docker image prune`
- Clean up unused volumes: `docker volume prune`

## 📚 More Information

See `DOCKER_README.md` for:
- Detailed setup instructions
- Environment variables
- Production considerations
- Advanced troubleshooting
