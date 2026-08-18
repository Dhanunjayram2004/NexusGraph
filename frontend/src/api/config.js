// Centralized API configuration and client
export const API_BASE_URL = 'https://nexusgraph-rpui.onrender.com';
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
      ...options,
    });

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) errorMessage = errorData.detail;
      } catch (e) {
        // Fallback to text or status
      }
      throw new Error(errorMessage);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  getHealth: () => apiRequest('/health'),
  getProjects: (domain, status, userId) => {
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (status) params.append('status', status);
    if (userId) params.append('user_id', userId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/projects/${qs}`);
  },
  getProject: (id, userId) => apiRequest(`/projects/${id}${userId ? `?user_id=${encodeURIComponent(userId)}` : ''}`),
  getProjectMembers: (id) => apiRequest(`/projects/${id}/members`),
  joinProject: (projectId, userId) =>
    apiRequest(`/projects/${projectId}/join?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
    }),
  leaveProject: (projectId, userId) =>
    apiRequest(`/projects/${projectId}/leave?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
    }),
  createProject: (data) =>
    apiRequest('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // FIXED: Both search and getRecommendations are securely here now!
// Add the slash right after search and before ?q=
search: (query, userId, domain = null) =>
  apiRequest(
    `/projects/search?q=${encodeURIComponent(query)}${
      userId ? `&user_id=${encodeURIComponent(userId)}` : ''
    }${domain ? `&domain=${encodeURIComponent(domain)}` : ''}`
  ),
  getUsers: () => apiRequest('/users/'),
  getRecommendations: (userId) => apiRequest(`/search/recommendations/${encodeURIComponent(userId)}`),
  getUser: (userId) => apiRequest(`/users/${encodeURIComponent(userId)}`),
};