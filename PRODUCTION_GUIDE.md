# Production Deployment Guide

## ⚠️ Current State Assessment

The Wettkampf application currently has several limitations for production:

### 🔴 Critical Issues

1. **Passwords stored in plaintext** - Security risk
2. **SQLite in-file database** - Limited scalability, no remote access
3. **No data backups** - Data loss risk
4. **No authentication tokens refresh** - JWT tokens don't refresh
5. **No rate limiting** - Vulnerable to abuse
6. **No input validation** - Security vulnerability
7. **No HTTPS** - Data transmitted unencrypted
8. **No monitoring/logging** - Can't debug issues in production
9. **Default admin password** - "ADMIN" hardcoded in code
10. **No multi-instance support** - Can't load balance

### 🟡 Medium Priority

1. No request logging
2. No error tracking/alerting
3. No database transactions
4. No API versioning
5. No graceful shutdown
6. Limited CORS configuration
7. No environment variable validation
8. Frontend not optimized (no compression, CDN)

---

## 🔧 Production Checklist

### Phase 1: Security (MUST DO FIRST)

- [ ] **Hash Passwords** - Use bcryptjs for password hashing
- [ ] **Environment Variables** - Remove hardcoded secrets
- [ ] **HTTPS/TLS** - Use SSL certificates
- [ ] **Remove Plaintext Passwords** - Delete password view endpoint
- [ ] **Input Validation** - Sanitize all user inputs
- [ ] **Rate Limiting** - Prevent brute force attacks
- [ ] **CORS Hardening** - Whitelist only trusted origins
- [ ] **JWT Token Refresh** - Implement token rotation
- [ ] **Remove Default Credentials** - No hardcoded admin passwords
- [ ] **Helmet.js** - Add security headers

### Phase 2: Infrastructure

- [ ] **Database Migration** - PostgreSQL or MySQL instead of SQLite
- [ ] **Reverse Proxy** - Nginx or similar for load balancing
- [ ] **Docker Production Build** - Multi-stage, optimized
- [ ] **Backup Strategy** - Automated database backups
- [ ] **Monitoring** - Uptime, error rate, performance
- [ ] **Logging** - Centralized log aggregation
- [ ] **CI/CD Pipeline** - Automated testing and deployment

### Phase 3: Performance

- [ ] **Frontend Optimization** - Minification, compression, code splitting
- [ ] **CDN** - Serve static assets from CDN
- [ ] **Caching** - Browser cache, server-side cache
- [ ] **Database Indexing** - Optimize queries
- [ ] **Load Testing** - Verify capacity

### Phase 4: Operations

- [ ] **Health Checks** - Endpoint for monitoring
- [ ] **Graceful Shutdown** - Clean connection cleanup
- [ ] **Error Handling** - Proper error responses
- [ ] **Documentation** - Deployment runbooks
- [ ] **Disaster Recovery** - Backup and restore procedures

---

## 🚀 Implementation Priority

### Week 1: Critical Security Fixes
1. Hash passwords
2. Environment variables
3. Input validation
4. HTTPS setup
5. Remove default credentials

### Week 2: Infrastructure
1. Database upgrade (PostgreSQL)
2. Reverse proxy (Nginx)
3. Automated backups
4. Monitoring setup

### Week 3: Performance & Operations
1. Frontend optimization
2. Caching strategy
3. Logging
4. Health checks

---

## 📋 Detailed Security Steps

### Step 1: Password Hashing

**Current (Insecure)**:
```javascript
// Backend/src/data/store.js - plaintext passwords
const adminPassword = 'ADMIN';
```

**Required (Secure)**:
```javascript
import bcryptjs from 'bcryptjs';

async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcryptjs.compare(password, hash);
}
```

**Changes needed**:
- Hash password on user creation
- Hash password on update
- Use bcrypt.compare in login endpoint
- Never return plaintext passwords in API responses
- Add migration script to hash existing passwords

### Step 2: Environment Variables

**Create .env file**:
```bash
# Backend/.env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/wettkampf
JWT_SECRET=your-secret-key-here-min-32-chars
CORS_ORIGINS=https://example.com,https://www.example.com
ADMIN_EMAIL=admin@example.com
```

**Update code**:
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable not set');
}
```

### Step 3: Input Validation

**Install validator**:
```bash
npm install validator
```

**Example validation**:
```javascript
import validator from 'validator';

function validateUsername(username) {
  if (!username || username.length < 3 || username.length > 50) {
    throw new Error('Username must be 3-50 characters');
  }
  if (!validator.isAlphanumeric(username)) {
    throw new Error('Username must be alphanumeric');
  }
}

function validatePassword(password) {
  if (!password || password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  if (!validator.isStrongPassword(password)) {
    throw new Error('Password must contain uppercase, lowercase, numbers, symbols');
  }
}
```

### Step 4: HTTPS/TLS

**Using Let's Encrypt (Free)**:
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d example.com

# Auto-renew
sudo systemctl enable certbot.timer
```

**Nginx configuration**:
```nginx
server {
  listen 443 ssl http2;
  server_name example.com;
  
  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
  
  # Redirect HTTP to HTTPS
  if ($scheme != "https") {
    return 301 https://$server_name$request_uri;
  }
}
```

### Step 5: JWT Token Refresh

**Current (No Refresh)**:
```javascript
// tokens never refresh or expire
```

**Required**:
```javascript
const JWT_EXPIRY = '15m'; // Short-lived access token
const REFRESH_EXPIRY = '7d'; // Long-lived refresh token

app.post('/api/auth/login', async (req, res) => {
  // ... verify credentials ...
  
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
  
  res.json({ accessToken, refreshToken });
});

app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### Step 6: Rate Limiting

**Install express-rate-limit**:
```bash
npm install express-rate-limit
```

**Add to server**:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.post('/api/auth/login', loginLimiter, (req, res) => {
  // ... login logic ...
});
```

### Step 7: Security Headers

**Install helmet**:
```bash
npm install helmet
```

**Add to server**:
```javascript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));
```

---

## 🗄️ Database Migration: SQLite → PostgreSQL

### Why PostgreSQL?

| Feature | SQLite | PostgreSQL |
|---------|--------|-----------|
| Concurrent users | Limited | Unlimited |
| Data size | Single file | Scalable |
| Remote access | No | Yes |
| Replication | No | Yes |
| Transactions | Limited | Full ACID |
| Backup | File copy | Streaming |

### Migration Steps

1. **Install PostgreSQL**:
```bash
sudo apt-get install postgresql postgresql-contrib
createdb wettkampf
psql wettkampf < schema.sql
```

2. **Update package.json**:
```bash
npm uninstall sql.js
npm install pg
```

3. **Update connection**:
```javascript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

export function getDb() {
  return pool;
}
```

4. **Data migration**:
```bash
# Export from SQLite
sqlite3 old.db ".mode csv" ".output data.csv" "SELECT * FROM users;"

# Import to PostgreSQL
psql -d wettkampf -c "COPY users FROM 'data.csv' WITH CSV;"
```

---

## 📊 Production Docker Setup

### Multi-stage Build (Optimized)

**Backend/Dockerfile.prod**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
USER nobody
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "src/server.js"]
```

**Frontend/Dockerfile.prod**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Production docker-compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: wettkampf
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - wettkampf
    restart: unless-stopped

  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/wettkampf
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    networks:
      - wettkampf
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - backend
    networks:
      - wettkampf
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  wettkampf:
```

---

## 🔍 Monitoring & Logging

### Health Check Endpoint

```javascript
app.get('/api/health', async (req, res) => {
  try {
    // Check database
    const result = await db.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Centralized Logging

**Install winston**:
```bash
npm install winston
```

**Setup logging**:
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'wettkampf-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## 🚀 Deployment Strategies

### Option 1: Single Server (Smallest)

```
┌─────────────────┐
│  Single Server  │
├─────────────────┤
│  Nginx (SSL)    │
│  Backend        │
│  PostgreSQL     │
│  (all in Docker)│
└─────────────────┘
```

**Cost**: ~$5-10/month (DigitalOcean)
**Setup**: 2-3 hours

### Option 2: Load Balanced (Medium)

```
┌──────────────────────┐
│   Load Balancer      │
│    (Nginx/HAProxy)   │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
┌───┴───┐     ┌──┴───┐
│Server1│     │Server2│
│Backend│     │Backend│
└───┬───┘     └───┬──┘
    │             │
    └──────┬──────┘
         ┌─┴─┐
         │DB │
    ┌────┴───┴────┐
    │  PostgreSQL  │
    │  Replication │
    └──────────────┘
```

**Cost**: ~$20-30/month
**Setup**: 8-10 hours

### Option 3: Managed Services (Easiest)

```
┌──────────────────────┐
│  Vercel/Netlify      │  (Frontend)
│  Heroku/Railway      │  (Backend)
│  AWS RDS             │  (Database)
└──────────────────────┘
```

**Cost**: ~$15-50/month
**Setup**: 1-2 hours
**Pros**: No ops overhead, auto-scaling

---

## 📋 Pre-Launch Checklist

### Security
- [ ] Passwords hashed (bcryptjs)
- [ ] No plaintext secrets in code
- [ ] Environment variables configured
- [ ] HTTPS enabled with valid certificate
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] CORS whitelist configured
- [ ] JWT token refresh implemented
- [ ] Helmet security headers enabled
- [ ] Default admin password changed
- [ ] Sensitive endpoints require auth
- [ ] API keys rotated

### Infrastructure
- [ ] Database backup automated
- [ ] Database replicated (if possible)
- [ ] Logs centralized
- [ ] Monitoring alerts configured
- [ ] Health check endpoint working
- [ ] Graceful shutdown implemented
- [ ] Load balancer configured
- [ ] Reverse proxy (Nginx) in place

### Performance
- [ ] Frontend minified and optimized
- [ ] Database indexes created
- [ ] Caching strategy implemented
- [ ] Load test passed (100+ concurrent users)
- [ ] CDN configured for static assets
- [ ] Response times < 500ms

### Operations
- [ ] Runbook documentation written
- [ ] Incident response plan ready
- [ ] Team trained on deployment
- [ ] Staging environment mirrors production
- [ ] Disaster recovery tested
- [ ] Rollback procedure tested

---

## 🎯 Immediate Action Items (Next 48 Hours)

1. **Hash all passwords** - Non-negotiable
2. **Set JWT_SECRET** - Random 32+ character string
3. **Enable HTTPS** - Use Let's Encrypt
4. **Setup environment variables** - No hardcoded secrets
5. **Add rate limiting** - Prevent brute force
6. **Remove default credentials** - Change admin password
7. **Setup basic monitoring** - Health check endpoint
8. **Document deployment process** - Create runbook

---

## 💰 Cost Estimate

| Scenario | Monthly | Setup Time |
|----------|---------|-----------|
| Single server (DigitalOcean) | $5-10 | 2-3 hrs |
| Load balanced (AWS/DigitalOcean) | $20-30 | 8-10 hrs |
| Managed services (Vercel/Railway) | $15-50 | 1-2 hrs |
| Enterprise (Multi-region, backups) | $100+ | 20+ hrs |

---

## 📚 Resources

- **Security**: https://owasp.org/www-project-top-ten/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Docker Production**: https://docs.docker.com/config/containers/resource_constraints/
- **Let's Encrypt**: https://letsencrypt.org/getting-started/

---

## ❓ Questions?

Key decisions needed:
1. **Database**: PostgreSQL or MySQL?
2. **Hosting**: Self-hosted or managed services?
3. **Scale**: Single server or load balanced?
4. **SLA**: 99.9% uptime required?
5. **Budget**: Budget constraints?
6. **Timeline**: Launch in 2 weeks or 2 months?

Answer these and we can create a detailed implementation plan.
