import type { DeviceCodeResponse } from '@lofi-pm/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as authApi from '../lib/authApi';

export type AuthStatus = 'idle' | 'checking' | 'awaiting_code' | 'authenticated' | 'error';

/**
 * Intent: Provide a React hook for managing GitHub authentication state and flows.
 */
export function useGitHubAuth() {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | undefined>();
  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const authStatus = await authApi.getAuthStatus();
      setIsAuthenticated(authStatus.authenticated);
      setUsername(authStatus.username);
      setStatus(authStatus.authenticated ? 'authenticated' : 'idle');
      setError(null);
    } catch (err) {
      console.error('Failed to check auth status:', err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const connect = useCallback(async () => {
    setStatus('checking');
    setError(null);
    setDeviceCode(null);
    try {
      const codeRes = await authApi.initiateDeviceFlow();
      setDeviceCode(codeRes);
      setStatus('awaiting_code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate auth');
      setStatus('error');
    }
  }, []);

  // Effect to handle polling once device code is received
  useEffect(() => {
    if (!deviceCode) return;

    let isMounted = true;
    const controller = new AbortController();

    const startPolling = async () => {
      // We don't immediately setStatus('polling') because we want to keep 'awaiting_code'
      // visible so the user can see the verification code while we poll in the background.
      try {
        const pollResult = await authApi.pollAuthStatus(controller.signal);
        if (isMounted) {
          setIsAuthenticated(pollResult.authenticated);
          setUsername(pollResult.username);
          setStatus(pollResult.authenticated ? 'authenticated' : 'idle');
          setDeviceCode(null);
        }
      } catch (err) {
        if (isMounted) {
          // Ignore abort errors as they are expected on unmount/Strict Mode double-effect
          if (err instanceof Error && err.name === 'AbortError') return;

          setError(err instanceof Error ? err.message : 'Authentication failed');
          setStatus('error');
        }
      }
    };

    startPolling();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [deviceCode]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setIsAuthenticated(false);
      setUsername(undefined);
      setStatus('idle');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  return {
    status,
    isAuthenticated,
    username,
    deviceCode,
    error,
    connect,
    logout,
    checkStatus,
  };
}
