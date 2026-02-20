import { DeviceCodeResponse, GitHubAuthStatus } from '@lofi-pm/core';
import { CONFIG } from './config';

/**
 * Intent: Provide a central HTTP client for GitHub authentication resources.
 */

export async function initiateDeviceFlow(): Promise<DeviceCodeResponse> {
  const response = await fetch(`${CONFIG.API_BASE}/auth/github/device-code`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate GitHub auth: ${response.statusText}`);
  }

  const data = await response.json();
  return DeviceCodeResponse.parse(data);
}

export async function pollAuthStatus(signal?: AbortSignal): Promise<GitHubAuthStatus> {
  const response = await fetch(`${CONFIG.API_BASE}/auth/github/poll`, { signal });

  if (!response.ok) {
    throw new Error(`GitHub authentication failed: ${response.statusText}`);
  }

  return GitHubAuthStatus.parse(await response.json());
}

export async function getAuthStatus(): Promise<GitHubAuthStatus> {
  const response = await fetch(`${CONFIG.API_BASE}/auth/github/status`);

  if (!response.ok) {
    throw new Error(`Failed to fetch auth status: ${response.statusText}`);
  }

  return GitHubAuthStatus.parse(await response.json());
}

export async function logout(): Promise<void> {
  const response = await fetch(`${CONFIG.API_BASE}/auth/github/logout`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to logout: ${response.statusText}`);
  }
}
