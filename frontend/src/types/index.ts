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
