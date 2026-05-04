# Docker Portable Deployment Guide

This guide explains how to build Docker images once and then move them to another computer.

## 📋 Overview

There are 3 ways to use Docker images:

| Method | Use Case | Steps |
|--------|----------|-------|
| **Development** | Live development with hot reload | `docker-compose up` |
| **Build & Move** | Build once, run anywhere | `./build-docker.sh` → Share tar file |
| **Registry** | Share via Docker Hub | Push images, pull anywhere |

## 🔨 Method 1: Build Once, Move Anywhere (Recommended)

This creates portable images that you can move to another computer.

### Step 1: Build images on your development machine

```bash
cd /path/to/Wettkampf
./build-docker.sh
```

This creates:
- `wettkampf-backend:latest`
- `wettkampf-frontend:latest`

### Step 2: Export images to a tar file

```bash
docker save -o wettkampf-images.tar \
  wettkampf-backend:latest \
  wettkampf-frontend:latest
```

This creates a single `wettkampf-images.tar` file (400-600 MB).

### Step 3: Transfer to another computer

```bash
# Via USB drive, scp, email, cloud storage, etc.
scp wettkampf-images.tar user@other-computer:/path/to/
```

### Step 4: Load images on the other computer

```bash
# On the other computer
cd /path/to/Wettkampf
docker load -i wettkampf-images.tar
```

### Step 5: Run with docker-compose

```bash
# Use production compose (doesn't rebuild)
docker-compose -f docker-compose.prod.yml up
```

Access at http://localhost:5173

## 📝 File Reference

| File | Purpose |
|------|---------|
| `docker-compose.yml` | **Development** - builds images, hot reload, src mounts |
| `docker-compose.prod.yml` | **Production** - uses pre-built images, no rebuilds |
| `build-docker.sh` | Builds images once with consistent tags |

## 🚀 Complete Workflow

### On Computer A (where you develop)

```bash
cd /path/to/Wettkampf

# Build images
./build-docker.sh

# Verify they exist
docker images | grep wettkampf

# Export to file
docker save -o wettkampf-images.tar \
  wettkampf-backend:latest \
  wettkampf-frontend:latest

# Copy to Computer B (USB, SCP, etc.)
```

### On Computer B (where you want to run it)

```bash
cd /path/to/Wettkampf

# Make sure you have docker-compose.prod.yml and Dockerfiles
# (copy entire Wettkampf directory)

# Load the images
docker load -i wettkampf-images.tar

# Verify images loaded
docker images | grep wettkampf

# Run the application
docker-compose -f docker-compose.prod.yml up

# Access at http://localhost:5173
```

## 🎯 Key Differences

### Development Workflow
```bash
# Use docker-compose.yml (default)
docker-compose up

# Rebuilds images each time
# Hot reload enabled (src/ mounted)
# Best for active development
```

### Production/Portable Workflow
```bash
# Use docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up

# Uses pre-built images (no rebuild)
# Faster startup
# Can be moved between computers
# Data persists in ./Backend/data
```

## 📦 What Gets Packaged

When you run `./build-docker.sh`, the images include:

**Backend Image**:
- Node.js 20 runtime
- All npm dependencies
- Backend source code (src/)
- Ready to run with `npm start`

**Frontend Image**:
- Node.js 20 runtime
- All npm dependencies
- Frontend source code (src/)
- Vite dev server ready to run

## 💾 Tar File Details

The `wettkampf-images.tar` file contains:
- Both Docker images
- All dependencies
- All source code
- Ready to extract and run

Size: ~400-600 MB (compressed images)

## ⚙️ Customization

If you want different image names, edit `build-docker.sh`:

```bash
# Change these lines
BACKEND_IMAGE="my-custom-backend:v1"
FRONTEND_IMAGE="my-custom-frontend:v1"
```

Then update `docker-compose.prod.yml`:

```yaml
services:
  backend:
    image: my-custom-backend:v1
  frontend:
    image: my-custom-frontend:v1
```

## 🔄 Updating Images

When you make code changes:

**If developing on same machine:**
```bash
# Rebuild images
./build-docker.sh

# Export new version
docker save -o wettkampf-images.tar ...

# Transfer to other computer
# Load on other computer: docker load -i wettkampf-images.tar
```

**If only updating code (not dependencies):**
- Edit files in Backend/src or Frontend/src
- Run `docker-compose up` for development
- Or rebuild with `./build-docker.sh` for production

## 🌐 Alternative: Docker Registry (Hub)

For even easier sharing across computers, push to Docker Hub:

```bash
# Tag images
docker tag wettkampf-backend:latest yourusername/wettkampf-backend:latest
docker tag wettkampf-frontend:latest yourusername/wettkampf-frontend:latest

# Push to Docker Hub
docker push yourusername/wettkampf-backend:latest
docker push yourusername/wettkampf-frontend:latest

# On other computer, use docker-compose.hub.yml
# with image: yourusername/wettkampf-backend:latest
```

This way you don't need to transfer tar files—just docker pull.

## 🛠️ Troubleshooting

### Images won't load
```bash
# Check if file is valid
file wettkampf-images.tar

# Try loading with verbose output
docker load -i wettkampf-images.tar -v

# Check available disk space
df -h
```

### Ports already in use
Edit `docker-compose.prod.yml`:

```yaml
ports:
  - "3002:3001"   # Use 3002 externally
  - "5174:5173"   # Use 5174 externally
```

### Need to rebuild images
```bash
# Delete old images
docker rmi wettkampf-backend:latest
docker rmi wettkampf-frontend:latest

# Build fresh
./build-docker.sh
```

## 📊 Summary Table

| Scenario | Command | File |
|----------|---------|------|
| Local development | `docker-compose up` | `docker-compose.yml` |
| Build for sharing | `./build-docker.sh` | `build-docker.sh` |
| Run shared images | `docker-compose -f docker-compose.prod.yml up` | `docker-compose.prod.yml` |
| Export to tar | `docker save -o ...` | N/A |
| Load from tar | `docker load -i ...` | N/A |

---

**TL;DR**: Run `./build-docker.sh` → `docker save` to tar → Copy tar → `docker load` → `docker-compose -f docker-compose.prod.yml up`
