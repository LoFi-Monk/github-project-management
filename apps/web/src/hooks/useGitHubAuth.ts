import type { DeviceCodeResponse } from '@lofi-pm/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as authApi from '../lib/authApi';

export type AuthStatus =
  | 'idle'
  | 'checking'
  | 'awaiting_code'
  | 'polling'
  | 'authenticated'
  | 'error';

/**
 * Intent: Provide a React hook for managing GitHub authentication state and flows.
 */
export function useGitHubAuth() {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | undefined>();
  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef(false);

  const checkStatus = useCallback(async () => {
    try {
      const authStatus = await authApi.getAuthStatus();
      setIsAuthenticated(authStatus.authenticated);
      setUsername(authStatus.username);
      if (authStatus.authenticated) {
        setStatus('authenticated');
      }
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
    if (!deviceCode || pollingRef.current) return;

    let isMounted = true;

    const startPolling = async () => {
      pollingRef.current = true;
      // We don't immediately setStatus('polling') because we want to keep 'awaiting_code'
      // visible so the user can see the verification code while we poll in the background.
      try {
        const pollResult = await authApi.pollAuthStatus();
        if (isMounted) {
          setIsAuthenticated(pollResult.authenticated);
          setUsername(pollResult.username);
          setStatus(pollResult.authenticated ? 'authenticated' : 'idle');
          setDeviceCode(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setStatus('error');
        }
      } finally {
        pollingRef.current = false;
      }
    };

    startPolling();

    return () => {
      isMounted = false;
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
