# 🚀 Wettkampf Docker - Start Here

## What Do You Want to Do?

### 1️⃣ Just Run It Locally (Development)
```bash
docker-compose up
```
Go to: http://localhost:5173

Then edit code in `Backend/src/` or `Frontend/src/` → auto reloads

### 2️⃣ Build Images to Move to Another Computer
```bash
./build-docker.sh
docker save -o wettkampf-images.tar wettkampf-backend:latest wettkampf-frontend:latest
# Now copy wettkampf-images.tar to another computer
```

On the other computer:
```bash
docker load -i wettkampf-images.tar
docker-compose -f docker-compose.prod.yml up
```

### 3️⃣ Share via Docker Hub (No File Transfer)
```bash
./build-docker.sh
docker tag wettkampf-backend:latest YOURNAME/wettkampf-backend
docker tag wettkampf-frontend:latest YOURNAME/wettkampf-frontend
docker push YOURNAME/wettkampf-backend
docker push YOURNAME/wettkampf-frontend
# Others can: docker-compose -f docker-compose.hub.yml up
```

## 📚 Full Documentation

- **DOCKER_OPTIONS.md** - Compare all 3 methods
- **DOCKER_PORTABLE.md** - Detailed moving-images guide
- **DOCKER_QUICK.md** - Command reference
- **DOCKER_README.md** - Complete documentation

## 💡 Key Commands

```bash
# Start development
docker-compose up

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Build images
./build-docker.sh

# Export to tar
docker save -o images.tar wettkampf-backend:latest wettkampf-frontend:latest

# Load from tar
docker load -i images.tar

# Run portable version
docker-compose -f docker-compose.prod.yml up
```

## ⚡ First Time?

1. Install Docker (https://docs.docker.com/get-docker/)
2. Run: `docker-compose up`
3. Open: http://localhost:5173
4. Done!

## 🐛 Debugging the Sorting Issue

The Docker setup includes debug logging. To test:

```bash
# Terminal 1: Start
docker-compose up

# Terminal 2: Watch logs
docker-compose logs -f | grep RANKING

# Browser: http://localhost:5173
# (Enter finale data to see debug output)
```

Look for: `[RANKING]`, `[FRONTEND]`, `[FRONTEND-FINALISTS]`

---

**Need more help?** Read DOCKER_README.md or DOCKER_OPTIONS.md
