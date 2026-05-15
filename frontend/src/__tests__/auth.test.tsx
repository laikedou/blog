import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/auth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock api
const mockProfile = jest.fn();
jest.mock('@/lib/api', () => ({
  auth: {
    login: jest.fn(),
    register: jest.fn(),
    profile: () => mockProfile(),
  },
}));

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    length: 0,
    key: jest.fn(),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="isAuthenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="isLoading">{String(auth.isLoading)}</span>
      <span data-testid="user">{auth.user ? auth.user.displayName : 'null'}</span>
      <button data-testid="login-btn" onClick={() => auth.login('user', 'pass')}>Login</button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>Logout</button>
      <button data-testid="register-btn" onClick={() => auth.register({ email: 'a@b.com', username: 'u', password: 'p' })}>Register</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('defaults to unauthenticated with no token', async () => {
    render(
      <AuthProvider><TestComponent /></AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

  it('restores session from localStorage token', async () => {
    localStorageMock.getItem.mockReturnValue('valid-token');
    mockProfile.mockResolvedValue({ id: 1, displayName: 'Test User', email: 'test@test.com', username: 'test' });

    render(
      <AuthProvider><TestComponent /></AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('Test User');
  });

  it('clears token when profile fetch fails', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-token');
    mockProfile.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider><TestComponent /></AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('does not call profile when no token', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <AuthProvider><TestComponent /></AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });
    expect(mockProfile).not.toHaveBeenCalled();
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

  it('provides useAuth context', () => {
    let captured: any;
    function Capture() {
      captured = useAuth();
      return null;
    }
    render(<AuthProvider><Capture /></AuthProvider>);
    expect(captured).toBeDefined();
    expect(captured.login).toBeInstanceOf(Function);
    expect(captured.logout).toBeInstanceOf(Function);
    expect(captured.register).toBeInstanceOf(Function);
  });
});
