export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  postCount: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  postCount: number;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  author: User;
  category: Category | null;
  tags: Tag[];
  seoTitle: string;
  seoDescription: string;
  aiGenerated: boolean;
  aiPrompt: string;
  comments?: Comment[];
  commentCount?: number;
}

export interface Comment {
  id: number;
  content: string;
  status: string;
  createdAt: string;
  author: User;
  postId: number;
  parentId: number | null;
  replies?: Comment[];
}

export interface Media {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText: string;
  createdAt: string;
  uploader: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  postId: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: number;
  sessionId: string;
  name: string;
  email: string;
  message: string;
  pageUrl: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Visualization ─────────────────────────────────────────────

export interface Visualization {
  id: number;
  title: string;
  subject: 'math' | 'physics';
  description: string;
  introduction: string;
  detailedExplanation: string;
  knowledgeSummary: string;
  tags: string;
  featuredImage: string;
  htmlContent: string;
  prompt: string;
  status: 'draft' | 'published';
  version: number;
  viewCount: number;
  interactCount: number;
  likesCount: number;
  author: { id: number; username: string; displayName: string };
  versions?: VisualizationVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface VisualizationVersion {
  id: number;
  visualizationId: number;
  htmlContent: string;
  prompt: string;
  changeNote: string;
  version: number;
  createdAt: string;
}

export interface VisualizationStat {
  id: number;
  visualizationId: number;
  action: string;
  metadata: string;
  createdAt: string;
}

export interface VisualizationStats {
  viewCount: number;
  interactCount: number;
  actions: Record<string, number>;
  dailyStats: { date: string; action: string; count: number }[];
}

export interface VisualizationAggregatedStats {
  totalViews: number;
  totalInteracts: number;
  bySubject: { subject: string; _count: number }[];
  byStatus: { status: string; _count: number }[];
  recent30Days: { date: string; count: number }[];
  totalVisualizations: number;
}

export interface VisualizationLikeStatus {
  liked: boolean;
  likesCount: number;
}

export interface VisualizationComment {
  id: number;
  content: string;
  visualizationId: number;
  authorId: number;
  author: { id: number; username: string; displayName: string; avatar: string; role: string };
  parentId: number | null;
  replies?: VisualizationComment[];
  createdAt: string;
  updatedAt: string;
}
