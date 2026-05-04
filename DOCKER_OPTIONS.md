# Docker Deployment Options - Complete Guide

Choose the option that best fits your needs:

## Option 1: Local Development (Fastest)

Build and run locally with hot reload.

```bash
cd /path/to/Wettkampf
docker-compose up
```

**Best for**: Active development, testing, debugging

**Files used**:
- `docker-compose.yml` (development)
- Rebuilds images automatically
- Hot reload enabled (src/ mounted)

**Pros**:
- ✅ Simplest setup
- ✅ Auto rebuilds on code changes
- ✅ Fastest for development
- ✅ One command to start

**Cons**:
- ❌ Rebuilds every time
- ❌ Requires source code on computer
- ❌ Not portable

---

## Option 2: Build Once, Share Tar File (Portable)

Build images once, export to tar file, move to another computer.

### On your machine:

```bash
# Step 1: Build images
cd /path/to/Wettkampf
./build-docker.sh

# Step 2: Export to tar
docker save -o wettkampf-images.tar \
  wettkampf-backend:latest \
  wettkampf-frontend:latest

# Step 3: Copy tar to another computer (USB, SCP, etc)
scp wettkampf-images.tar user@other-machine:/path/to/
```

### On another machine:

```bash
# Step 1: Copy Wettkampf directory (or just docker-compose.prod.yml)
cd /path/to/Wettkampf

# Step 2: Load images from tar
docker load -i wettkampf-images.tar

# Step 3: Run
docker-compose -f docker-compose.prod.yml up
```

**Best for**: Sharing with team members, CI/CD pipelines, pre-built deployments

**Files used**:
- `build-docker.sh` (to build)
- `docker-compose.prod.yml` (to run)
- `wettkampf-images.tar` (portable file)

**Pros**:
- ✅ Works on any computer with Docker
- ✅ No source code needed on target computer
- ✅ Fast startup (images pre-built)
- ✅ Consistent environment
- ✅ Portable via file transfer

**Cons**:
- ❌ Large tar file (400-600 MB)
- ❌ Need to rebuild for code changes
- ❌ Manual transfer process

---

## Option 3: Docker Hub Registry (Cloud)

Push images to Docker Hub, pull from anywhere.

### On your machine:

```bash
# Step 1: Build images
./build-docker.sh

# Step 2: Create Docker Hub account (if needed)
# Go to https://hub.docker.com

# Step 3: Tag images
docker tag wettkampf-backend:latest YOUR_DOCKER_USER/wettkampf-backend:latest
docker tag wettkampf-frontend:latest YOUR_DOCKER_USER/wettkampf-frontend:latest

# Step 4: Login to Docker Hub
docker login

# Step 5: Push images
docker push YOUR_DOCKER_USER/wettkampf-backend:latest
docker push YOUR_DOCKER_USER/wettkampf-frontend:latest
```

### On another machine:

```bash
# Step 1: Create docker-compose.hub.yml:
# (change image names to YOUR_DOCKER_USER/...)

# Step 2: Run
docker-compose -f docker-compose.hub.yml up
```

**Best for**: Cloud deployment, sharing with larger teams, public projects

**Pros**:
- ✅ No file transfer needed
- ✅ Accessible from anywhere
- ✅ Public or private repositories
- ✅ Version control for images
- ✅ Docker Hub integration with CI/CD

**Cons**:
- ❌ Requires Docker Hub account
- ❌ Initial push takes time (uploads 400-600 MB)
- ❌ Limited free storage/bandwidth

---

## Quick Decision Guide

```
┌─ Do you need to run locally with hot reload?
│  ├─ YES → Use Option 1: docker-compose up
│  └─ NO → Continue...
│
├─ Do you need to move images to other computers?
│  ├─ YES, via file transfer → Use Option 2: Build + Tar
│  ├─ YES, via cloud/registry → Use Option 3: Docker Hub
│  └─ NO → Use Option 1
└─
```

---

## File Structure

```
Wettkampf/
├── docker-compose.yml              (Development - rebuild each time)
├── docker-compose.prod.yml         (Production - pre-built images)
├── docker-compose.hub.yml          (Optional - for Docker Hub)
├── build-docker.sh                 (Build script)
├── Backend/
│   ├── Dockerfile
│   └── src/
├── Frontend/
│   ├── Dockerfile
│   └── src/
├── DOCKER_PORTABLE.md              (Detailed portable guide)
└── This file
```

---

## Step-by-Step Examples

### Example 1: Local Development

```bash
# Day 1: Start development
cd ~/Wettkampf
docker-compose up

# Edit code in Backend/src or Frontend/src
# Changes auto-reload

# Stop when done
# (Ctrl+C or docker-compose down)

# Day 2: Continue development
cd ~/Wettkampf
docker-compose up
# Rebuilds automatically
```

### Example 2: Share with Team Member via Tar

```bash
# You (Developer A):
cd ~/Wettkampf
./build-docker.sh
docker save -o wettkampf-images.tar \
  wettkampf-backend:latest \
  wettkampf-frontend:latest

# Transfer to colleague:
scp wettkampf-images.tar dev_b@colleague.local:/tmp/

# Colleague (Developer B):
cd ~/Wettkampf
docker load -i /tmp/wettkampf-images.tar
docker-compose -f docker-compose.prod.yml up
# Now running your exact images
```

### Example 3: Share via Docker Hub

```bash
# You:
./build-docker.sh
docker tag wettkampf-backend:latest myuser/wettkampf-backend:v1.0
docker tag wettkampf-frontend:latest myuser/wettkampf-frontend:v1.0
docker login
docker push myuser/wettkampf-backend:v1.0
docker push myuser/wettkampf-frontend:v1.0

# Anyone on the internet:
# Edit docker-compose.yml to use myuser/wettkampf-* images
docker-compose up
```

---

## Environment Variables

Customize by editing compose files:

### Development (docker-compose.yml)
```yaml
environment:
  - NODE_ENV=development
  - PORT=3001
  - CORS_ORIGINS=http://localhost:5173,http://frontend:5173
```

### Production (docker-compose.prod.yml)
```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - CORS_ORIGINS=http://localhost:5173,http://frontend:5173
```

---

## Data Persistence

Backend stores data in `./Backend/data` (mounted as volume):

```yaml
volumes:
  - ./Backend/data:/app/data
```

This means:
- Data persists when you stop containers
- Data available on your computer
- Easy to backup (just copy the folder)

---

## Troubleshooting

### "Port already in use"

Edit the compose file:
```yaml
ports:
  - "3002:3001"   # Use 3002 instead of 3001
  - "5174:5173"   # Use 5174 instead of 5173
```

### "Images not found"

Make sure you've run:
```bash
./build-docker.sh
```

Or loaded them:
```bash
docker load -i wettkampf-images.tar
```

### "Can't connect to backend"

Both services must be running:
```bash
docker-compose ps
# Should show both 'backend' and 'frontend' as 'Up'
```

### "Data disappeared"

Data is in `./Backend/data`. If you delete with `docker-compose down -v`, volumes are deleted.

Use `docker-compose down` (without `-v`) to keep data.

---

## Summary Table

| Need | Command | File | Notes |
|------|---------|------|-------|
| Local dev | `docker-compose up` | `docker-compose.yml` | Hot reload, rebuilds |
| Build portable | `./build-docker.sh` | `build-docker.sh` | Creates images |
| Export portable | `docker save -o ...` | N/A | Creates tar file |
| Load portable | `docker load -i ...` | N/A | Loads from tar |
| Run portable | `docker-compose -f docker-compose.prod.yml up` | `docker-compose.prod.yml` | No rebuild |
| Push to registry | `docker push ...` | N/A | Upload to Docker Hub |
| Pull from registry | `docker-compose -f docker-compose.hub.yml up` | `docker-compose.hub.yml` | Download from Docker Hub |

---

## Next Steps

1. **Try Option 1 first** (local development) - it's the fastest
2. **When ready to share**, try Option 2 (tar export)
3. **For team/production**, consider Option 3 (Docker Hub)

Each option builds on the previous one - you're not locked in!
