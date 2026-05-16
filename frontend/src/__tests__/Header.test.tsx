import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock auth context
const mockLogout = jest.fn();
let mockAuthState: { user: { displayName: string; email: string } | null; isAuthenticated: boolean; logout: jest.Mock } = { user: null, isAuthenticated: false, logout: mockLogout };
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockAuthState,
}));

// Mock UI components
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <span data-testid="avatar-fallback">{children}</span>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <button data-testid="dropdown-item" onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-sep" />,
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { user: null, isAuthenticated: false, logout: mockLogout };
  });

  it('renders the blog name link', () => {
    render(<Header />);
    expect(screen.getByText('AI Blog')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Web3')).toBeInTheDocument();
    expect(screen.getByText('Blockchain')).toBeInTheDocument();
    expect(screen.getByText('Dev')).toBeInTheDocument();
  });

  it('shows sign in button when not authenticated', () => {
    render(<Header />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('shows user avatar when authenticated', () => {
    mockAuthState = { user: { displayName: 'John', email: 'john@test.com' }, isAuthenticated: true, logout: mockLogout };
    render(<Header />);
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('J');
  });

  it('shows fallback initial for user without displayName', () => {
    mockAuthState = { user: { displayName: '', email: '' }, isAuthenticated: true, logout: mockLogout };
    render(<Header />);
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('U');
  });

  it('renders mobile menu toggle', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    expect(menuButton).toBeInTheDocument();
  });

  it('renders sign in link with correct href', () => {
    render(<Header />);
    const signIn = screen.getByText('Sign in');
    expect(signIn.closest('a')).toHaveAttribute('href', '/login');
  });

  it('renders register link with correct href', () => {
    render(<Header />);
    const register = screen.getByText('Get started');
    expect(register.closest('a')).toHaveAttribute('href', '/register');
  });
});
