import { calculateSeoScore, generatePostMetadata, generateListMetadata, articleJsonLd, breadcrumbJsonLd, websiteJsonLd, organizationJsonLd } from '@/lib/seo';

describe('calculateSeoScore', () => {
  const goodPost = {
    title: 'The Future of Artificial Intelligence in 2025',
    excerpt: 'A comprehensive look at how artificial intelligence is shaping the future of technology and our daily lives.',
    content: '<p>Artificial intelligence is transforming every industry. AI technology continues to evolve rapidly.</p>'.repeat(20),
    seoTitle: 'Future of AI 2025 | Complete Guide',
    seoDescription: 'Explore how artificial intelligence is transforming industries in 2025. A complete guide to AI trends and innovations.',
    featuredImage: 'https://example.com/image.jpg',
    tags: [{ name: 'AI' }, { name: 'Technology' }],
    slug: 'future-of-ai-2025',
  };

  it('should calculate a score and return check details for a well-optimized post', () => {
    const result = calculateSeoScore(goodPost);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.checks).toBeDefined();
  });

  it('should detect missing SEO title', () => {
    const result = calculateSeoScore({ ...goodPost, seoTitle: '' });
    expect(result.checks.seoTitle.pass).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it('should detect missing meta description', () => {
    const result = calculateSeoScore({ ...goodPost, seoDescription: '' });
    expect(result.checks.seoDescription.pass).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it('should detect short title', () => {
    const result = calculateSeoScore({ ...goodPost, title: 'Short' });
    expect(result.checks.titleLength.pass).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it('should detect missing excerpt', () => {
    const result = calculateSeoScore({ ...goodPost, excerpt: 'Short' });
    expect(result.checks.excerpt.pass).toBe(false);
  });

  it('should detect missing featured image', () => {
    const result = calculateSeoScore({ ...goodPost, featuredImage: '' });
    expect(result.checks.featuredImage.pass).toBe(false);
  });

  it('should detect missing tags', () => {
    const result = calculateSeoScore({ ...goodPost, tags: [] });
    expect(result.checks.tags.pass).toBe(false);
  });

  it('should detect short content', () => {
    const result = calculateSeoScore({ ...goodPost, content: '<p>Short</p>' });
    expect(result.checks.contentLength.pass).toBe(false);
  });

  it('should return all expected check keys', () => {
    const result = calculateSeoScore(goodPost);
    const expectedKeys = ['titleLength', 'seoTitle', 'seoDescription', 'excerpt', 'contentLength', 'featuredImage', 'tags', 'slug', 'keywordDensity'];
    expectedKeys.forEach(key => {
      expect(result.checks).toHaveProperty(key);
    });
  });
});

describe('generatePostMetadata', () => {
  const mockPost = {
    title: 'Test Post',
    slug: 'test-post',
    excerpt: 'A test post excerpt.',
    featuredImage: 'https://example.com/image.jpg',
    publishedAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-16T00:00:00.000Z',
    author: { displayName: 'John Doe', avatar: '' },
    category: { name: 'Technology', slug: 'technology' },
    tags: [{ name: 'JavaScript', slug: 'javascript' }],
    seoTitle: 'Test Post | My Blog',
    seoDescription: 'A comprehensive test post about JavaScript and web development.',
  };

  it('should use seoTitle when available', () => {
    const metadata = generatePostMetadata(mockPost);
    expect(metadata.title).toBe('Test Post | My Blog');
  });

  it('should fall back to title when seoTitle is missing', () => {
    const metadata = generatePostMetadata({ ...mockPost, seoTitle: '' });
    expect(metadata.title).toBe('Test Post');
  });

  it('should generate canonical URL', () => {
    const metadata = generatePostMetadata(mockPost);
    expect(metadata.alternates?.canonical).toContain('/posts/test-post');
  });

  it('should set article Open Graph type', () => {
    const metadata = generatePostMetadata(mockPost);
    const og = metadata.openGraph as any;
    expect(og.type).toBe('article');
    expect(og.publishedTime).toBeDefined();
    expect(og.authors).toContain('John Doe');
  });

  it('should include tags in OG metadata', () => {
    const metadata = generatePostMetadata(mockPost);
    expect((metadata.openGraph as any).tags).toContain('JavaScript');
  });

  it('should set twitter card to summary_large_image', () => {
    const metadata = generatePostMetadata(mockPost);
    expect((metadata.twitter as any).card).toBe('summary_large_image');
  });

  it('should use fallback image when no featured image', () => {
    const metadata = generatePostMetadata({ ...mockPost, featuredImage: '' });
    expect(metadata.openGraph?.images).toBeDefined();
    expect(Array.isArray(metadata.openGraph?.images)).toBe(true);
  });
});

describe('generateListMetadata', () => {
  it('should generate list page metadata', () => {
    const metadata = generateListMetadata('Category Page', 'Category description', '/category/tech');
    expect(metadata.title).toBe('Category Page');
    expect(metadata.description).toBe('Category description');
    expect(metadata.alternates?.canonical).toContain('/category/tech');
    expect((metadata.openGraph as any).type).toBe('website');
  });
});

describe('articleJsonLd', () => {
  const mockPost = {
    title: 'Test Article',
    slug: 'test-article',
    excerpt: 'An excerpt',
    featuredImage: 'https://example.com/image.jpg',
    publishedAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-16T00:00:00.000Z',
    author: { displayName: 'John Doe', avatar: '' },
    category: { name: 'Tech', slug: 'tech' },
    tags: [{ name: 'JavaScript', slug: 'javascript' }],
    seoTitle: '',
    seoDescription: '',
  };

  it('should generate valid BlogPosting schema', () => {
    const schema = articleJsonLd(mockPost) as any;
    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Test Article');
    expect(schema.author).toEqual({ '@type': 'Person', name: 'John Doe' });
    expect(schema.publisher).toHaveProperty('@type', 'Organization');
    expect(schema.keywords).toBe('JavaScript');
  });

  it('should include category as articleSection', () => {
    const schema = articleJsonLd(mockPost) as any;
    expect(schema.articleSection).toBe('Tech');
  });

  it('should include datePublished and dateModified', () => {
    const schema = articleJsonLd(mockPost) as any;
    expect(schema.datePublished).toBeDefined();
    expect(schema.dateModified).toBeDefined();
  });
});

describe('breadcrumbJsonLd', () => {
  it('should generate valid BreadcrumbList schema', () => {
    const items = [
      { name: 'Home', url: 'https://example.com' },
      { name: 'Category', url: 'https://example.com/category/tech' },
      { name: 'Post', url: 'https://example.com/posts/test' },
    ];
    const schema = breadcrumbJsonLd(items) as any;

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].name).toBe('Home');
    expect(schema.itemListElement[2].position).toBe(3);
    expect(schema.itemListElement[2].name).toBe('Post');
  });
});

describe('websiteJsonLd', () => {
  it('should generate valid WebSite schema with SearchAction', () => {
    const schema = websiteJsonLd() as any;
    expect(schema['@type']).toBe('WebSite');
    expect(schema.potentialAction).toBeDefined();
    expect(schema.potentialAction['@type']).toBe('SearchAction');
    expect(schema.name).toBeDefined();
    expect(schema.url).toBeDefined();
  });
});

describe('organizationJsonLd', () => {
  it('should generate valid Organization schema', () => {
    const schema = organizationJsonLd() as any;
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBeDefined();
    expect(schema.url).toBeDefined();
    expect(schema.logo).toBeDefined();
  });
});
