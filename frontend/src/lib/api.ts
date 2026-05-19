const API_BASE = '/api';

// SSE streaming must bypass Next.js dev server rewrite proxy, which buffers
// streaming responses. Use the backend URL directly when available.
const SSE_BASE = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : API_BASE;

const DEFAULT_TIMEOUT = 120_000; // 2 minutes — AI generation can be slow

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const locale = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (locale) {
    headers['Accept-Language'] = locale;
    headers['X-Locale'] = locale;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Add timeout if not already set via options.signal
  const controls: { signal?: AbortSignal } = {};
  if (!options.signal) {
    controls.signal = AbortSignal.timeout(DEFAULT_TIMEOUT);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    ...controls,
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
  batchUpdateStatus: (ids: number[], status: string) =>
    request<any>('/comments/batch-update-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  like: (id: number) =>
    request<any>(`/comments/${id}/like`, { method: 'POST' }),
  getLikeStatus: (id: number) =>
    request<any>(`/comments/${id}/like-status`),
};

// Media
export const media = {
  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v));
      });
    }
    return request<any>(`/media?${searchParams.toString()}`);
  },
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/media/upload', { method: 'POST', body: formData });
  },
  delete: (id: number) =>
    request<any>(`/media/${id}`, { method: 'DELETE' }),
  batchDelete: (ids: number[]) =>
    request<any>('/media/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  batchDownload: (ids: number[]) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch('/api/media/batch-download', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids }),
    }).then(async (res) => {
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });
  },
  batchMove: (ids: number[], folderId?: number | null) =>
    request<any>('/media/batch-move', { method: 'POST', body: JSON.stringify({ ids, folderId }) }),
  folders: {
    list: () => request<any[]>('/media/folders'),
    create: (name: string, parentId?: number) =>
      request<any>('/media/folders', { method: 'POST', body: JSON.stringify({ name, parentId }) }),
    update: (id: number, name: string) =>
      request<any>(`/media/folders/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
    delete: (id: number) =>
      request<any>(`/media/folders/${id}`, { method: 'DELETE' }),
  },
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
  active: (params?: { zone?: string }) => {
    const qs = params?.zone ? `?zone=${encodeURIComponent(params.zone)}` : '';
    return request<any[]>(`/banners/active${qs}`);
  },
  get: (id: number) => request<any>(`/banners/${id}`),
  create: (data: any) =>
    request<any>('/banners', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<any>(`/banners/${id}`, { method: 'DELETE' }),
  trackClick: (id: number) =>
    request<any>(`/banners/${id}/click`, { method: 'POST' }),
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

export interface SSEStreamCallbacks {
  onInit?: (data: { id: number; title: string }) => void;
  onChunk?: (text: string) => void;
  onDone?: (data: { id: number; htmlContent: string; raw: string; title: string; status: string }) => void;
  onError?: (message: string) => void;
}

// Visualizations
export const visualizations = {
  generate: (data: { prompt: string; subject: string; provider?: string; title?: string; language?: string }) =>
    request<any>('/visualizations/generate', { method: 'POST', body: JSON.stringify(data) }),
  generateStream: (data: { prompt: string; subject: string; provider?: string; title?: string; language?: string }, callbacks: SSEStreamCallbacks, signal?: AbortSignal) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${SSE_BASE}/visualizations/generate-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal,
    }).then(async (res) => {
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Generation failed' }));
        throw new Error(errBody.message || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
          } else if (trimmed.startsWith('data: ')) {
            const payload = trimmed.slice(6).trim();
            try {
              const parsed = JSON.parse(payload);
              switch (currentEvent) {
                case 'init':
                  callbacks.onInit?.(parsed);
                  break;
                case 'chunk':
                  callbacks.onChunk?.(parsed.text);
                  break;
                case 'done':
                  callbacks.onDone?.(parsed);
                  break;
                case 'error':
                  callbacks.onError?.(parsed.message);
                  break;
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    });
  },
  refine: (data: { visualizationId: number; feedback: string; language?: string }) =>
    request<any>('/visualizations/refine', { method: 'POST', body: JSON.stringify(data) }),
  refineStream: (data: { visualizationId: number; feedback: string; language?: string }, callbacks: {
    onChunk?: (text: string) => void;
    onDone?: (data: { id: number; htmlContent: string; version: number }) => void;
    onError?: (message: string) => void;
  }, signal?: AbortSignal) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${SSE_BASE}/visualizations/refine-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal,
    }).then(async (res) => {
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Refine failed' }));
        throw new Error(errBody.message || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
          } else if (trimmed.startsWith('data: ')) {
            const payload = trimmed.slice(6).trim();
            try {
              const parsed = JSON.parse(payload);
              switch (currentEvent) {
                case 'chunk':
                  callbacks.onChunk?.(parsed.text);
                  break;
                case 'done':
                  callbacks.onDone?.(parsed);
                  break;
                case 'error':
                  callbacks.onError?.(parsed.message);
                  break;
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    });
  },
  fixError: (data: { visualizationId: number; error: string; language?: string }) =>
    request<any>('/visualizations/fix-error', { method: 'POST', body: JSON.stringify(data) }),
  getProviders: () => request<{ providers: string[]; default: string }>('/visualizations/providers'),
  list: (params?: Record<string, any>) => {
    const sp = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') sp.set(k, String(v)); });
    return request<any>(`/visualizations?${sp}`);
  },
  listPublished: (params?: Record<string, any>) => {
    const sp = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) sp.set(k, String(v)); });
    return request<any>(`/visualizations/published?${sp}`);
  },
  get: (id: number) => request<any>(`/visualizations/${id}`),
  create: (data: any) =>
    request<any>('/visualizations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request<any>(`/visualizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publish: (id: number, status: string) =>
    request<any>(`/visualizations/${id}/publish`, { method: 'PUT', body: JSON.stringify({ status }) }),
  generateCover: (id: number) =>
    request<any>(`/visualizations/${id}/generate-cover`, { method: 'POST' }),
  generateMetadata: (id: number, language?: string) =>
    request<{ introduction: string; detailedExplanation: string; knowledgeSummary: string }>(`/visualizations/${id}/generate-metadata`, { method: 'POST', body: JSON.stringify({ language }) }),
  generateMetadataStream: (id: number, language: string | undefined, callbacks: {
    onFieldChunk?: (field: string, text: string) => void;
    onDone?: (data: { introduction: string; detailedExplanation: string; knowledgeSummary: string }) => void;
    onError?: (message: string) => void;
  }, signal?: AbortSignal) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${SSE_BASE}/visualizations/${id}/generate-metadata-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ language }),
      signal,
    }).then(async (res) => {
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Metadata generation failed' }));
        throw new Error(errBody.message || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim();
          } else if (trimmed.startsWith('data: ')) {
            const payload = trimmed.slice(6).trim();
            try {
              const parsed = JSON.parse(payload);
              switch (currentEvent) {
                case 'chunk':
                  callbacks.onFieldChunk?.(parsed.field, parsed.text);
                  break;
                case 'done':
                  callbacks.onDone?.(parsed);
                  break;
                case 'error':
                  callbacks.onError?.(parsed.message);
                  break;
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    });
  },
  delete: (id: number) =>
    request<any>(`/visualizations/${id}`, { method: 'DELETE' }),
  batchUpdateStatus: (ids: number[], status: string) =>
    request<any>('/visualizations/batch-update-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  batchDelete: (ids: number[]) =>
    request<any>('/visualizations/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  fork: (id: number) =>
    request<any>(`/visualizations/${id}/fork`, { method: 'POST' }),
  recordStat: (id: number, action: string, metadata?: any) =>
    request<any>(`/visualizations/${id}/stats`, { method: 'POST', body: JSON.stringify({ action, metadata }) }),
  getStats: (id: number) => request<any>(`/visualizations/${id}/stats`),
  getAggregatedStats: () => request<any>('/visualizations/stats/aggregated'),
  like: (id: number) => request<{ liked: boolean; likesCount: number }>(`/visualizations/${id}/like`, { method: 'POST' }),
  getLikeStatus: (id: number) => request<{ liked: boolean; likesCount: number }>(`/visualizations/${id}/like-status`),
  getComments: (id: number) => request<any[]>(`/visualizations/${id}/comments`),
  createComment: (id: number, data: { content: string; parentId?: number }) =>
    request<any>(`/visualizations/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  deleteComment: (commentId: number) =>
    request<any>(`/visualizations/comments/${commentId}`, { method: 'DELETE' }),
  // Admin: visualization comment moderation
  listVizComments: (params?: Record<string, any>) => {
    const sp = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') sp.set(k, String(v)); });
    return request<any>(`/visualizations/admin/viz-comments?${sp}`);
  },
  updateVizComment: (id: number, data: { content?: string; status?: string }) =>
    request<any>(`/visualizations/admin/viz-comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVizComment: (id: number) =>
    request<any>(`/visualizations/admin/viz-comments/${id}`, { method: 'DELETE' }),
  batchUpdateVizCommentStatus: (ids: number[], status: string) =>
    request<any>('/visualizations/admin/viz-comments/batch-update-status', { method: 'POST', body: JSON.stringify({ ids, status }) }),
  getRelated: (id: number) => request<any[]>(`/visualizations/${id}/related`),

  // ── Version Management ──
  getVersions: (id: number) => request<any[]>(`/visualizations/${id}/versions`),
  getVersionDetail: (id: number, versionId: number) => request<any>(`/visualizations/${id}/versions/${versionId}`),
  restoreVersion: (id: number, versionId: number, changeNote?: string) =>
    request<any>(`/visualizations/${id}/versions/${versionId}/restore`, { method: 'POST', body: JSON.stringify({ changeNote }) }),
  compareVersions: (id: number, fromVersionId: number, toVersionId: number) =>
    request<any>(`/visualizations/${id}/versions/compare`, { method: 'POST', body: JSON.stringify({ fromVersionId, toVersionId }) }),

  // ── Topic Suggestions ──
  suggestTopics: (params?: { subject?: string; count?: number }) => {
    const sp = new URLSearchParams();
    if (params?.subject) sp.set('subject', params.subject);
    if (params?.count) sp.set('count', String(params.count));
    const qs = sp.toString();
    return request<any[]>(`/visualizations/topics/suggest${qs ? `?${qs}` : ''}`);
  },

  // ── Article Mode (Feature 5) ──
  generateArticleQuiz: (id: number, language?: string) =>
    request<any>(`/visualizations/${id}/article/generate`, { method: 'POST', body: JSON.stringify({ language }) }),
  updateArticleConfig: (id: number, data: { articleMode?: boolean; quiz?: string }) =>
    request<any>(`/visualizations/${id}/article/config`, { method: 'PUT', body: JSON.stringify(data) }),

  // ── AI Tutor (Feature 1) ──
  askTutor: (id: number, data: { sessionId: string; interactionType: string; parameterName?: string; parameterValue?: string; question?: string; language?: string }) =>
    request<any>(`/visualizations/${id}/tutor/ask`, { method: 'POST', body: JSON.stringify(data) }),
  getTutorHistory: (id: number, sessionId: string) =>
    request<any[]>(`/visualizations/${id}/tutor/history?sessionId=${encodeURIComponent(sessionId)}`),

  // ── Difficulty (Feature 4) ──
  generateDifficulty: (id: number, data: { levels: string[]; language?: string }) =>
    request<any>(`/visualizations/${id}/difficulty/generate`, { method: 'POST', body: JSON.stringify(data) }),
  getDifficulty: (id: number) =>
    request<any>(`/visualizations/${id}/difficulty`),

  // ── Narration (Feature 3) ──
  generateNarration: (id: number, locale?: string) =>
    request<any>(`/visualizations/${id}/narration/generate`, { method: 'POST', body: JSON.stringify({ locale }) }),
  getNarration: (id: number, locale?: string) => {
    const sp = new URLSearchParams();
    if (locale) sp.set('locale', locale);
    const qs = sp.toString();
    return request<any>(`/visualizations/${id}/narration${qs ? `?${qs}` : ''}`);
  },
};

// AI
export const ai = {
  generatePost: (data: any, language?: string) => {
    const body = language ? { ...data, language } : data;
    return request<any>('/ai/generate-post', { method: 'POST', body: JSON.stringify(body) });
  },
  enhanceContent: (data: any, language?: string) => {
    const body = language ? { ...data, language } : data;
    return request<any>('/ai/enhance-content', { method: 'POST', body: JSON.stringify(body) });
  },
  generateSeo: (data: any, language?: string) => {
    const body = language ? { ...data, language } : data;
    return request<any>('/ai/generate-seo', { method: 'POST', body: JSON.stringify(body) });
  },
  suggestTags: (data: any) =>
    request<any>('/ai/suggest-tags', { method: 'POST', body: JSON.stringify(data) }),
  imagePrompt: (data: any, language?: string) => {
    const body = language ? { ...data, language } : data;
    return request<any>('/ai/image-prompt', { method: 'POST', body: JSON.stringify(body) });
  },
  chat: (messages: { role: string; content: string }[]) =>
    request<any>('/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  generateCover: (data: { title: string; excerpt?: string; provider?: string }) =>
    request<{ url: string; prompt: string; provider?: string }>('/ai/generate-cover', { method: 'POST', body: JSON.stringify(data) }),
  generateBanner: (data: { title: string; subtitle?: string; height?: number; provider?: string }) =>
    request<{ url: string; prompt: string; provider?: string }>('/ai/generate-banner', { method: 'POST', body: JSON.stringify(data) }),
  transformImage: (data: { imageUrl: string; prompt?: string }) =>
    request<{ url: string }>('/ai/transform-image', { method: 'POST', body: JSON.stringify(data) }),
  analyzeSeo: (data: { title: string; content?: string; seoTitle?: string; seoDescription?: string; targetEngine?: string }) =>
    request<any>('/ai/analyze-seo', { method: 'POST', body: JSON.stringify(data) }),
  generateLogo: (data: { brandName: string; tagline?: string }) =>
    request<{ url: string; format: string; provider: string | null }>('/ai/generate-logo', { method: 'POST', body: JSON.stringify(data) }),
  generateFavicon: (data: { brandName: string }) =>
    request<{ url: string; format: string; provider: string | null }>('/ai/generate-favicon', { method: 'POST', body: JSON.stringify(data) }),
  generateLegalPolicy: (data: { type: 'privacy' | 'terms'; siteName: string; siteUrl: string; siteEmail: string }) =>
    request<{ content: string }>('/ai/generate-legal-policy', { method: 'POST', body: JSON.stringify(data) }),
};

// Site Config
export const siteConfig = {
  get: () => request<any>('/site-config'),
  update: (data: any) =>
    request<any>('/site-config', { method: 'PUT', body: JSON.stringify(data) }),
};

// Error Logs
export const logs = {
  list: (params?: Record<string, any>) => {
    const sp = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.set(k, String(v)); });
    return request<any>(`/logs?${sp}`);
  },
  stats: () => request<any>('/logs/stats'),
  get: (id: number) => request<any>(`/logs/${id}`),
  clear: () => request<any>('/logs', { method: 'DELETE' }),
};

// AI Usage
export const aiUsage = {
  list: (params?: Record<string, any>) => {
    const sp = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.set(k, String(v)); });
    return request<any>(`/ai-usage?${sp}`);
  },
  stats: () => request<any>('/ai-usage/stats'),
};

// i18n
export const i18nApi = {
  detectLocale: () => request<{ locale: string; supportedLocales: string[] }>('/i18n/detect'),
};

// ── Classroom (Feature 2) ──
export const classrooms = {
  create: (data: { name: string; visualizationId: number }) =>
    request<any>('/classrooms', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => request<any>(`/classrooms/${id}`),
  join: (joinCode: string) =>
    request<any>('/classrooms/join', { method: 'POST', body: JSON.stringify({ joinCode }) }),
  leave: (id: number) => request<any>(`/classrooms/${id}/leave`, { method: 'POST' }),
  remove: (id: number) => request<any>(`/classrooms/${id}`, { method: 'DELETE' }),
  getEvents: (id: number, since?: string) => {
    const sp = new URLSearchParams();
    if (since) sp.set('since', since);
    const qs = sp.toString();
    return request<any[]>(`/classrooms/${id}/events${qs ? `?${qs}` : ''}`);
  },
  getLivekitToken: (id: number) =>
    request<any>(`/classrooms/${id}/livekit-token`),
};

// ── Experiments (Feature 6) ──
export const experiments = {
  create: (data: { concept: string; subject: string; perspectiveCount?: number; language?: string }) =>
    request<any>('/experiments', { method: 'POST', body: JSON.stringify(data) }),
  list: () => request<any[]>('/experiments'),
  get: (id: number) => request<any>(`/experiments/${id}`),
  remove: (id: number) => request<any>(`/experiments/${id}`, { method: 'DELETE' }),
};
