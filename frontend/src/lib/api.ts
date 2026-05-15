const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const auth = {
  login: (username: string, password: string) =>
    request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  profile: () => request<any>('/auth/profile'),
};

// Posts
export const posts = {
  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v));
      });
    }
    const qs = searchParams.toString();
    return request<any>(`/posts${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) => request<any>(`/posts/${id}`),
  getBySlug: (slug: string) => request<any>(`/posts/slug/${slug}`),
  create: (data: any) =>
    request<any>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/posts/${id}`, { method: 'DELETE' }),
};

// Categories
export const categories = {
  list: () => request<any[]>('/categories'),
  get: (id: number) => request<any>(`/categories/${id}`),
  create: (data: any) =>
    request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/categories/${id}`, { method: 'DELETE' }),
};

// Tags
export const tags = {
  list: () => request<any[]>('/tags'),
  get: (id: number) => request<any>(`/tags/${id}`),
  create: (data: any) =>
    request<any>('/tags', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/tags/${id}`, { method: 'DELETE' }),
};

// Comments
export const comments = {
  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.set(k, String(v));
      });
    }
    return request<any>(`/comments?${searchParams}`);
  },
  byPost: (postId: number) => request<any[]>(`/comments/post/${postId}`),
  create: (data: any) =>
    request<any>('/comments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/comments/${id}`, { method: 'DELETE' }),
};

// Media
export const media = {
  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.set(k, String(v));
      });
    }
    return request<any>(`/media?${searchParams}`);
  },
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/media/upload', { method: 'POST', body: formData });
  },
  delete: (id: number) =>
    request<any>(`/media/${id}`, { method: 'DELETE' }),
};

// Crawl
export const crawl = {
  sources: {
    list: () => request<any[]>('/crawl/sources'),
    create: (data: { name: string; url: string; interval: number }) =>
      request<any>('/crawl/sources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) =>
      request<any>(`/crawl/sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/crawl/sources/${id}`, { method: 'DELETE' }),
    run: (id: number) => request<any>(`/crawl/sources/${id}/run`, { method: 'POST' }),
  },
  articles: {
    list: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return request<any>(`/crawl/articles${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => request<any>(`/crawl/articles/${id}`),
    publish: (id: number) => request<any>(`/crawl/articles/${id}/publish`, { method: 'POST' }),
    delete: (id: number) => request<any>(`/crawl/articles/${id}`, { method: 'DELETE' }),
  },
};

// Stats
export const stats = {
  dashboard: () => request<any>('/stats/dashboard'),
  postStats: (id: number) => request<any>(`/stats/posts/${id}`),
};

// SEO
export const seo = {
  dashboard: () => request<any>('/seo/dashboard'),
  auditPost: (postId: number) => request<any>(`/seo/audit/${postId}`, { method: 'POST' }),
  getPostAudits: (postId: number) => request<any>(`/seo/audits/${postId}`),
  getAllAudits: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return request<any>(`/seo/audits?${params}`);
  },
  keywords: {
    list: () => request<any[]>('/seo/keywords'),
    create: (data: { keyword: string; source?: string; volume?: number; difficulty?: number }) =>
      request<any>('/seo/keywords', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/seo/keywords/${id}`, { method: 'DELETE' }),
    rankings: (id: number) => request<any[]>(`/seo/keywords/${id}/rankings`),
    recordRanking: (data: { keywordId: number; position?: number; page?: string; source?: string }) =>
      request<any>('/seo/keywords/ranking', { method: 'POST', body: JSON.stringify(data) }),
  },
  clicks: {
    list: (days?: number) => request<any>(`/seo/clicks?days=${days || 30}`),
    record: (data: { postId?: number; pageUrl: string; source?: string; clicks?: number; impressions?: number; ctr?: number; avgPosition?: number }) =>
      request<any>('/seo/clicks', { method: 'POST', body: JSON.stringify(data) }),
  },
  indexStatus: {
    list: () => request<any[]>('/seo/index-status'),
    update: (data: { pageUrl: string; googleIndexed?: boolean; baiduIndexed?: boolean; errors?: string }) =>
      request<any>('/seo/index-status', { method: 'POST', body: JSON.stringify(data) }),
  },
  suggestions: (postId: number) => request<any>(`/seo/suggestions/${postId}`),
};

// Banners
export const banners = {
  list: () => request<any[]>('/banners'),
  active: () => request<any[]>('/banners/active'),
  get: (id: number) => request<any>(`/banners/${id}`),
  create: (data: any) =>
    request<any>('/banners', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/banners/${id}`, { method: 'DELETE' }),
};

// Chat
export const chat = {
  logMessage: (data: { sessionId: string; role: string; content: string }) =>
    request<any>('/chat/log', { method: 'POST', body: JSON.stringify(data) }),
  submitFeedback: (data: { sessionId: string; name?: string; email?: string; message: string; pageUrl?: string }) =>
    request<any>('/chat/feedback', { method: 'POST', body: JSON.stringify(data) }),
  searchPosts: (query: string, limit?: number) =>
    request<any[]>('/chat/search', { method: 'POST', body: JSON.stringify({ query, limit }) }),
  getStats: () => request<any>('/chat/stats'),
  getFeedback: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return request<any>(`/chat/feedback?${params}`);
  },
  markFeedbackRead: (id: number) =>
    request<any>(`/chat/feedback/${id}/read`, { method: 'PUT' }),
};

// AI
export const ai = {
  generatePost: (data: any) =>
    request<any>('/ai/generate-post', { method: 'POST', body: JSON.stringify(data) }),
  enhanceContent: (data: any) =>
    request<any>('/ai/enhance-content', { method: 'POST', body: JSON.stringify(data) }),
  generateSeo: (data: any) =>
    request<any>('/ai/generate-seo', { method: 'POST', body: JSON.stringify(data) }),
  suggestTags: (data: any) =>
    request<any>('/ai/suggest-tags', { method: 'POST', body: JSON.stringify(data) }),
  imagePrompt: (data: any) =>
    request<any>('/ai/image-prompt', { method: 'POST', body: JSON.stringify(data) }),
  chat: (messages: { role: string; content: string }[]) =>
    request<any>('/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  generateCover: (data: { title: string; excerpt?: string }) =>
    request<{ url: string; prompt: string }>('/ai/generate-cover', { method: 'POST', body: JSON.stringify(data) }),
  generateBanner: (data: { title: string; subtitle?: string; height?: number }) =>
    request<{ url: string; prompt: string }>('/ai/generate-banner', { method: 'POST', body: JSON.stringify(data) }),
  transformImage: (data: { imageUrl: string; prompt?: string }) =>
    request<{ url: string }>('/ai/transform-image', { method: 'POST', body: JSON.stringify(data) }),
  analyzeSeo: (data: { title: string; content?: string; seoTitle?: string; seoDescription?: string; targetEngine?: string }) =>
    request<any>('/ai/analyze-seo', { method: 'POST', body: JSON.stringify(data) }),
};
