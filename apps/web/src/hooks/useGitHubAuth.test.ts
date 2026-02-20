import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../lib/authApi';
import { useGitHubAuth } from './useGitHubAuth';

vi.mock('../lib/authApi');

describe('useGitHubAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior
    vi.mocked(authApi.getAuthStatus).mockResolvedValue({ authenticated: false });
  });

  it('should be idle initially and fetch status', async () => {
    const { result } = renderHook(() => useGitHubAuth());

    expect(result.current.status).toBe('idle');
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => expect(authApi.getAuthStatus).toHaveBeenCalled());
  });

  it('should initiate device flow when connect is called', async () => {
    vi.mocked(authApi.initiateDeviceFlow).mockResolvedValue({
      userCode: 'CODE-123',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 5,
    });
    // Prevent polling from resolving immediately in this test
    vi.mocked(authApi.pollAuthStatus).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useGitHubAuth());

    await act(async () => {
      await result.current.connect();
    });

    // It should reach awaiting_code and stay there while polling
    await waitFor(() => expect(result.current.status).toBe('awaiting_code'));

    expect(result.current.deviceCode).toEqual({
      userCode: 'CODE-123',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 5,
    });
  });

  it('should poll and become authenticated on success', async () => {
    vi.mocked(authApi.initiateDeviceFlow).mockResolvedValue({
      userCode: 'CODE',
      verificationUri: 'URI',
      expiresIn: 900,
      interval: 5,
    });
    vi.mocked(authApi.pollAuthStatus).mockResolvedValue({
      authenticated: true,
      username: 'lofi-monk',
    });

    const { result } = renderHook(() => useGitHubAuth());

    await act(async () => {
      await result.current.connect();
    });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.username).toBe('lofi-monk');
  });

  it('should handle logout', async () => {
    vi.mocked(authApi.getAuthStatus).mockResolvedValue({
      authenticated: true,
      username: 'lofi-monk',
    });
    vi.mocked(authApi.logout).mockResolvedValue();

    const { result } = renderHook(() => useGitHubAuth());

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.username).toBeUndefined();
    expect(authApi.logout).toHaveBeenCalled();
  });

  it('should show authenticated status if checkStatus finds valid session on mount', async () => {
    vi.mocked(authApi.getAuthStatus).mockResolvedValue({
      authenticated: true,
      username: 'lofi-monk',
    });

    const { result } = renderHook(() => useGitHubAuth());

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.username).toBe('lofi-monk');
  });
});
