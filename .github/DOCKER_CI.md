# GitHub CI/CD - Docker Image Building

This project includes three GitHub Actions workflows for building Docker images:

## Workflows

### 1. `docker-build.yml` - Main CI Workflow (Recommended)
**Triggers:** Push/PR to main/develop, manual workflow dispatch

This is the **primary workflow** for development and CI. It:
- ✅ Builds backend and frontend images separately
- ✅ Automatically pushes to GitHub Container Registry (GHCR) on main branch pushes
- ✅ Creates pull request verification builds (no push)
- ✅ Uses Docker layer caching via GitHub Actions Cache
- ✅ Tags images with:
  - Branch name (e.g., `main`, `develop`)
  - Git SHA (e.g., `main-abc1234`)
  - Semantic version tags (if tagged)
  - `latest` tag (for default branch)

**Features:**
- Requires `GITHUB_TOKEN` (automatically provided)
- Images pushed to: `ghcr.io/<owner>/<repo>-<service>`
- Works on both public and private repositories

**Example output:**
```
ghcr.io/myorg/wettkampf-backend:main
ghcr.io/myorg/wettkampf-backend:main-abc1234567
ghcr.io/myorg/wettkampf-backend:latest
ghcr.io/myorg/wettkampf-frontend:main
ghcr.io/myorg/wettkampf-frontend:latest
```

### 2. `docker-build-local.yml` - Local Build Verification
**Triggers:** Push/PR to main/develop, daily schedule, manual dispatch

Use this workflow for:
- ✅ Quick build verification without pushing
- ✅ Testing on all commits
- ✅ Scheduled daily builds to catch base image updates

**Features:**
- Builds both backend and frontend
- Verifies images are valid
- No registry push (local verification only)
- Runs on schedule daily at 2 AM UTC

### 3. `docker-push-registry.yml` - Tagged Release Builds
**Triggers:** Tag creation (e.g., `v1.0.0`), main branch, manual dispatch

Use this workflow for:
- ✅ Release builds to registry
- ✅ Semantic versioning support
- ✅ Production image distribution

**Features:**
- Only runs on tags or main branch
- Supports semantic versioning tags
- Intended for releases and production deployments

## Quick Start

### Using GitHub Container Registry (GHCR) - Default

The main workflow (`docker-build.yml`) automatically uses GHCR with your `GITHUB_TOKEN`.

1. **Make a commit and push to main:**
   ```bash
   git push origin main
   ```

2. **Check Actions tab** - workflow runs automatically

3. **Pull images:**
   ```bash
   docker pull ghcr.io/<owner>/<repo>-backend:latest
   docker pull ghcr.io/<frontend>/<repo>-frontend:latest
   ```

### Extending to Docker Hub (Optional)

To also push to Docker Hub:

1. Create Docker Hub access token at https://hub.docker.com/settings/security
2. Add GitHub secrets:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
3. Modify `docker-build.yml` to add Docker Hub login (see example below)

### Example: Adding Docker Hub

Edit `.github/workflows/docker-build.yml` and add after the GHCR login step:

```yaml
- name: Log in to Docker Hub
  if: github.event_name != 'pull_request'
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

Then update image names in metadata extraction:

```yaml
- name: Extract metadata for backend
  id: meta-backend
  uses: docker/metadata-action@v5
  with:
    images: |
      ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend
      docker.io/${{ secrets.DOCKERHUB_USERNAME }}/wettkampf-backend
```

## Local Development

To build images locally without CI:

```bash
# Build both images
./build-docker.sh

# Or individual builds
docker build -t wettkampf-backend:latest ./Backend
docker build -t wettkampf-frontend:latest ./Frontend

# Run with docker-compose
docker-compose up
```

## Image Tags and Versioning

### Automatic Tagging Strategy

The workflows automatically create multiple tags for each image:

| Event | Tags Generated |
|-------|----------------|
| Push to `main` | `latest`, `main`, `main-<sha>` |
| Push to `develop` | `develop`, `develop-<sha>` |
| Tag push (e.g., `v1.2.3`) | `1.2.3`, `1.2`, `latest` |
| Pull Request | Build only, no push |

## Monitoring Builds

1. Go to **Actions** tab in GitHub repository
2. Click on a workflow run to see:
   - Build logs
   - Layer cache status
   - Image push status
   - Performance metrics

## Troubleshooting

### Images not pushing?
- Check workflow logs for authentication errors
- Verify `GITHUB_TOKEN` has `packages:write` permission
- Ensure repository visibility allows push (private repos work)

### Build fails on specific step?
- Check Dockerfile for syntax errors
- Verify all required files are in context
- Look at layer cache status

### Want to disable a workflow?
- Go to Actions tab
- Click "Disable workflow" on the workflow you want to disable
- To re-enable: go to .github/workflows and click the workflow

## Architecture

### Build Strategy

- **Backend** (`Backend/Dockerfile`): Node.js Alpine base, runs on port 3001
- **Frontend** (`Frontend/Dockerfile`): Node.js Alpine base, Vite dev server, port 5173

### Caching

Both workflows use GitHub Actions cache to speed up repeated builds:
- Docker layer cache is stored in Actions cache
- Builds are faster on subsequent runs
- Cache is available across workflows

## Security Notes

- Images run as non-root user (backend)
- Base images are kept up-to-date via scheduled builds
- No secrets stored in images
- `GITHUB_TOKEN` is automatically provided and scoped

## Next Steps

1. Commit these workflow files to your repository
2. Push to GitHub
3. Check the Actions tab to see workflows running
4. Pull built images: `docker pull ghcr.io/<owner>/<repo>-backend:latest`
5. (Optional) Add Docker Hub secrets if you want to publish there too
