describe('Type definitions', () => {
  it('User type has correct structure', () => {
    const user: import('@/types').User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      avatar: '',
      bio: 'Bio text',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    expect(user.id).toBe(1);
    expect(user.role).toBe('admin');
  });

  it('PaginatedResponse type is generic', () => {
    const response: import('@/types').PaginatedResponse<{ name: string }> = {
      data: [{ name: 'Item 1' }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    expect(response.data[0].name).toBe('Item 1');
  });

  it('Banner type has correct structure', () => {
    const banner: import('@/types').Banner = {
      id: 1,
      title: 'Welcome Banner',
      subtitle: 'Subtitle',
      imageUrl: '/uploads/banner.png',
      linkUrl: '/posts/1',
      postId: 1,
      sortOrder: 0,
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    expect(banner.title).toBe('Welcome Banner');
    expect(banner.isActive).toBe(true);
    expect(banner.sortOrder).toBe(0);
    expect(banner.imageUrl).toBe('/uploads/banner.png');
  });

  it('Feedback type has correct structure', () => {
    const feedback: import('@/types').Feedback = {
      id: 1,
      sessionId: 'session_1',
      name: 'Test User',
      email: 'test@test.com',
      message: 'Great blog! Love the AI content.',
      pageUrl: '/posts/ai-development',
      isRead: false,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    expect(feedback.message).toBe('Great blog! Love the AI content.');
    expect(feedback.isRead).toBe(false);
    expect(feedback.pageUrl).toBe('/posts/ai-development');
  });

  it('Post type includes all fields', () => {
    const post: import('@/types').Post = {
      id: 1,
      title: 'Post',
      slug: 'post',
      content: '<p>Content</p>',
      excerpt: 'Excerpt',
      featuredImage: '',
      status: 'published',
      publishedAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      viewCount: 10,
      author: { id: 1, email: '', username: '', displayName: '', avatar: '', role: 'user', createdAt: '' },
      category: null,
      tags: [],
      seoTitle: '',
      seoDescription: '',
      aiGenerated: false,
      aiPrompt: '',
      commentCount: 0,
    };
    expect(post.status).toBe('published');
    expect(post.viewCount).toBe(10);
  });
});
