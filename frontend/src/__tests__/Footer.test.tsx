import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Footer', () => {
  it('renders the blog name', () => {
    render(<Footer />);
    expect(screen.getByText('AI Blog')).toBeInTheDocument();
  });

  it('renders quick links', () => {
    render(<Footer />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('renders category links', () => {
    render(<Footer />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('renders support links', () => {
    render(<Footer />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Use')).toBeInTheDocument();
  });

  it('renders the copyright year', () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(year)))).toBeInTheDocument();
  });

  it('contains links with correct hrefs', () => {
    render(<Footer />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
