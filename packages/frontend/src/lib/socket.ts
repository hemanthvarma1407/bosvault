'use client';

import io from 'socket.io-client';
import { configVariables } from '@bosvault/shared-services';

const socketInstances: Record<string, any> = {};

// Use standardized base URL from config
const baseUrl = configVariables.APP_AVS_SERVICE_URL ? configVariables.APP_AVS_SERVICE_URL.replace(/\/api$/, '') : '';

/**
 * Get or create a socket instance for a specific namespace
 * @param namespace The namespace to connect to (e.g., '/ws', '/tickets')
 */
export function getSocket(namespace = '/ws'): any {
  // Normalize namespace
  const ns = namespace.startsWith('/') ? namespace : `/${namespace}`;
  const socketKey = `${baseUrl}${ns}`;

  if (!socketInstances[socketKey]) {
    console.log(`[Socket] Initializing connection to: ${socketKey}`);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    socketInstances[socketKey] = (io as any)(socketKey, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: false,
      autoConnect: true,
      auth: {
        token
      },
      extraHeaders: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      query: {
        token
      }
    });

    socketInstances[socketKey].on('connect', () => {
      console.log(`[Socket] Connected to ${ns}:`, socketInstances[socketKey].id);
    });

    socketInstances[socketKey].on('disconnect', (reason: string) => {
      console.warn(`[Socket] Disconnected from ${ns}:`, reason);
    });

    socketInstances[socketKey].on('connect_error', (error: any) => {
      // console.error(`[Socket] Connection error on ${ns}:`, error.message);
    });
  }

  return socketInstances[socketKey];
}

/**
 * Disconnect all socket instances
 */
export function disconnectAllSockets() {
  Object.keys(socketInstances).forEach((key) => {
    socketInstances[key].disconnect();
    delete socketInstances[key];
  });
}

/**
 * Compatibility export for original single disconnect
 */
export function disconnectSocket() {
  disconnectAllSockets();
}
