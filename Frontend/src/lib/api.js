// Resolve API base URL with sensible fallbacks:
// 1) Use runtime config from window.RUNTIME_CONFIG (set by config.js at runtime)
// 2) Use VITE_API_URL when provided at build time (should include protocol, e.g. http://backend:3001)
// 3) When running in browser on localhost, assume backend is at the same host on port 3001
// 4) Otherwise fall back to relative /api so a reverse proxy can route requests (recommended for prod TLS)
let API_BASE = null;

// Check for runtime configuration first (set by config.js)
let VITE_API = null;
if (typeof window !== 'undefined' && window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.VITE_API_URL) {
  VITE_API = window.RUNTIME_CONFIG.VITE_API_URL;
} else {
  // Fall back to build-time environment variable
  VITE_API = import.meta.env.VITE_API_URL;
}
if (VITE_API) {
  // ensure the value includes a protocol; if not, assume http
  API_BASE = (VITE_API.match(/^https?:\/\//) ? VITE_API : `http://${VITE_API}`) + '/api';
  // Normalise common misconfigurations: if someone accidentally provided https for the internal
  // Docker hostname `backend`, switch it to http because that host is not TLS-terminating here.
  try {
    const parsed = new URL(API_BASE);
    if (parsed.hostname === 'backend' && parsed.protocol === 'https:') {
      parsed.protocol = 'http:';
      API_BASE = parsed.origin + '/api';
    }
  } catch (e) {
    // ignore parsing errors and keep API_BASE as-is
  }
  // Defensive fallback: if API_BASE still contains https://backend, force http://backend
  if (typeof API_BASE === 'string' && API_BASE.indexOf('https://backend') !== -1) {
    API_BASE = API_BASE.replace(/^https:\/\/backend/, 'http://backend');
  }

  // If code runs in a browser, the hostname 'backend' is not resolvable there.
  // When that happens, rewrite the hostname to the page's host (or 'localhost') so
  // the browser uses a reachable address. This avoids ERR_NAME_NOT_RESOLVED.
  if (typeof window !== 'undefined' && typeof API_BASE === 'string' && /:\/\/backend(\/|:|$)/.test(API_BASE)) {
    const pageHost = window.location.hostname || 'localhost';
    const pageProto = (window.location.protocol || 'http:').replace(':', '');
    // prefer the page protocol to avoid mixed-content
    const proto = pageProto || 'http';
    API_BASE = `${proto}://${pageHost}:3001/api`;
    // eslint-disable-next-line no-console
    console.info(`[wettkampf] Rewrote internal backend host to browser-accessible host: ${API_BASE}`);
  }
} else if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  // For local development we explicitly use http to avoid accidental https forcing.
  if (host === 'localhost' || host === '127.0.0.1') {
    API_BASE = `http://${host}:3001/api`;
  } else {
    // rely on same-origin + reverse proxy in front of frontend
    API_BASE = '/api';
  }
}

// If the page is served over https but API_BASE is http, warn: browsers block mixed-content.
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE && API_BASE.startsWith('http://')) {
  // don't try to force http; inform the operator to enable TLS or reverse proxy
  // This is intentional: mixed-content (https page -> http API) will be blocked by browsers.
  // The user should enable TLS via a reverse proxy in front of the app.
  // For now we log a clear message to help debugging.
  // eslint-disable-next-line no-console
  console.warn('[wettkampf] Page is served over HTTPS but API_BASE is HTTP. Browser will block mixed-content requests. Use TLS or a reverse proxy.');
}

// Helpful debug note in console so operator can see which API base was chosen
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[wettkampf] Using API_BASE=${API_BASE}`);
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  // Log the exact request for debugging (helps detect accidental https usage)
  // eslint-disable-next-line no-console
  console.debug('[wettkampf] request', options.method || 'GET', url);

  // Defensive: if the page is served over HTTP but url is https (or vice versa), log a clear error
  if (typeof window !== 'undefined') {
    const pageProto = window.location.protocol; // 'http:' or 'https:'
    if (pageProto === 'http:' && url.startsWith('https://')) {
      // eslint-disable-next-line no-console
      console.error('[wettkampf] Attempting to call HTTPS API from HTTP page (will be blocked or fail):', url);
    }
    if (pageProto === 'https:' && url.startsWith('http://')) {
      // eslint-disable-next-line no-console
      console.warn('[wettkampf] Page is HTTPS but API is HTTP (mixed-content will be blocked):', url);
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Ein Fehler ist aufgetreten');
  }
  
  return data;
}

export const api = {
  auth: {
    login: (password) => 
      request('/login', { method: 'POST', body: JSON.stringify({ password }) }),
    logout: () => request('/logout', { method: 'POST' }),
    me: () => request('/me'),
    check: () => request('/check', { method: 'POST' })
  },
  
  users: {
    list: () => request('/Users'),
    create: (data) => request('/Users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/Users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/Users/${id}`, { method: 'DELETE' })
  },
  
  groups: {
    list: () => request('/Groups'),
    admin: {
      list: () => request('/admin/Groups'),
      create: (data) => request('/admin/Groups', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/admin/Groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/admin/Groups/${id}`, { method: 'DELETE' })
    }
  },
  
  routes: {
    list: (userId) => request(userId ? `/Routes?userId=${encodeURIComponent(userId)}` : '/Routes'),
    setResult: (routeId, result, userId, resultType = 'points') => request('/Routes/result', { method: 'POST', body: JSON.stringify({ routeId, result, userId, resultType }) }),
    setBonusResult: (routeId, count, userId) => request('/Routes/bonus', { method: 'POST', body: JSON.stringify({ routeId, count, userId }) }),
    admin: {
      list: () => request('/admin/Routes'),
      create: (data) => request('/admin/Routes', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/admin/Routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/admin/Routes/${id}`, { method: 'DELETE' })
    }
  },
  
  finale: {
    list: () => request('/Finale')
  },
  
  results: {
    // Use the request wrapper to ensure consistent headers and credentials
    get: () => request('/results')
  },
  
  config: {
    get: () => request('/config'),
    update: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) })
  },
  
  data: {
    exportConfig: () => {
      window.open(`${API_BASE}/admin/data/config`, '_blank');
    },
    exportRoutes: () => {
      window.open(`${API_BASE}/admin/data/routes`, '_blank');
    },
    exportUsers: () => {
      window.open(`${API_BASE}/admin/data/users`, '_blank');
    },
    exportGroups: () => {
      window.open(`${API_BASE}/admin/data/groups`, '_blank');
    },
    importConfig: (data) => request('/admin/data/config', { method: 'POST', body: JSON.stringify(data) }),
    importRoutes: (mode, data) => request('/admin/data/routes', { method: 'POST', body: JSON.stringify({ mode, data }) }),
    importUsers: (mode, data) => request('/admin/data/users', { method: 'POST', body: JSON.stringify({ mode, data }) }),
    importGroups: (mode, data) => request('/admin/data/groups', { method: 'POST', body: JSON.stringify({ mode, data }) })
  }
};
