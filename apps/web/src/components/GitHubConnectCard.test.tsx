import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { GitHubConnectCard } from './GitHubConnectCard';

vi.mock('../hooks/useGitHubAuth');

describe('GitHubConnectCard', () => {
  const mockConnect = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render connect button when idle', () => {
    vi.mocked(useGitHubAuth).mockReturnValue({
      status: 'idle',
      isAuthenticated: false,
      username: undefined,
      deviceCode: null,
      error: null,
      connect: mockConnect,
      logout: mockLogout,
      checkStatus: vi.fn(),
    });

    render(<GitHubConnectCard />);
    expect(screen.getByText(/Connect to GitHub/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Connect to GitHub/i));
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should render user code and URI when awaiting_code', () => {
    vi.mocked(useGitHubAuth).mockReturnValue({
      status: 'awaiting_code',
      isAuthenticated: false,
      username: undefined,
      deviceCode: {
        userCode: 'ABCD-1234',
        verificationUri: 'https://github.com/login/device',
        expiresIn: 900,
        interval: 5,
      },
      error: null,
      connect: mockConnect,
      logout: mockLogout,
      checkStatus: vi.fn(),
    });

    render(<GitHubConnectCard />);
    expect(screen.getByText('ABCD-1234')).toBeInTheDocument();
    expect(screen.getByText(/Visit/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://github.com/login/device');
  });

  it('should render username and logout when authenticated', () => {
    vi.mocked(useGitHubAuth).mockReturnValue({
      status: 'authenticated',
      isAuthenticated: true,
      username: 'lofi-monk',
      deviceCode: null,
      error: null,
      connect: mockConnect,
      logout: mockLogout,
      checkStatus: vi.fn(),
    });

    render(<GitHubConnectCard />);
    expect(screen.getByText(/lofi-monk/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Logout/i));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should render error message on error', () => {
    vi.mocked(useGitHubAuth).mockReturnValue({
      status: 'error',
      isAuthenticated: false,
      username: undefined,
      deviceCode: null,
      error: 'Auth failed',
      connect: mockConnect,
      logout: mockLogout,
      checkStatus: vi.fn(),
    });

    render(<GitHubConnectCard />);
    expect(screen.getByText('Auth failed')).toBeInTheDocument();
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
  });
});
