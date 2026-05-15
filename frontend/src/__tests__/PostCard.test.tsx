import { render, screen } from '@testing-library/react';
import PostCard from '@/components/PostCard';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock animejs
jest.mock('animejs', () => ({
  animate: jest.fn().mockReturnValue({ finished: Promise.resolve() }),
  stagger: jest.fn().mockReturnValue(80),
}));

const mockPost = {
  id: 1,
  title: 'Test Post Title',
  slug: 'test-post',
  excerpt: 'This is a test excerpt for the post card component.',
  featuredImage: 'https://example.com/image.jpg',
  publishedAt: '2024-01-15T00:00:00.000Z',
  author: { displayName: 'John Doe', avatar: '' },
  category: { name: 'Technology', slug: 'technology', color: '#6366f1' },
  tags: [{ id: 1, name: 'JavaScript', slug: 'javascript' }],
  viewCount: 42,
  commentCount: 3,
};

describe('PostCard', () => {
  it('renders post title as a link', () => {
    render(<PostCard post={mockPost} />);
    const titleLink = screen.getByText('Test Post Title');
    expect(titleLink).toBeInTheDocument();
    expect(titleLink.closest('a')).toHaveAttribute('href', '/posts/test-post');
  });

  it('renders category badge', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders view count', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('42 views')).toBeInTheDocument();
  });

  it('renders comment count', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('3 comments')).toBeInTheDocument();
  });

  it('renders featured image with descriptive alt text', () => {
    render(<PostCard post={mockPost} />);
    const img = screen.getByAltText(/Test Post Title/) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/image.jpg');
  });

  it('renders without category', () => {
    const postWithoutCategory = { ...mockPost, category: null };
    render(<PostCard post={postWithoutCategory} />);
    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
  });
});
