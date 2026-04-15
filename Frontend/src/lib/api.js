const API_BASE = 'http://localhost:3001/api';

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
    login: (username, password) => 
      request('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
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
    list: () => request('/Routes'),
    toggle: (routeId) => request('/Routes/toggle', { method: 'POST', body: JSON.stringify({ routeId }) }),
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
    get: () => request('/results')
  },
  
  config: {
    get: () => request('/config'),
    update: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) })
  }
};
