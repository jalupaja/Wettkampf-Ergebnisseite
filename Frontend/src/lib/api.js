// Resolve API base URL with sensible fallbacks:
// 1) Use VITE_API_URL when provided at build time (should include protocol, e.g. http://backend:3001)
// 2) When running in browser on localhost, assume backend is at the same host on port 3001
// 3) Otherwise fall back to relative /api so a reverse proxy can route requests (recommended for prod TLS)
let API_BASE = null;
const VITE_API = import.meta.env.VITE_API_URL;
if (VITE_API) {
  // ensure the value includes a protocol; if not, assume http
  API_BASE = (VITE_API.match(/^https?:\/\//) ? VITE_API : `http://${VITE_API}`) + '/api';
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
  const response = await fetch(`${API_BASE}${endpoint}`, {
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
    get: () => fetch(`${API_BASE}/results`).then(r => r.json())
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
