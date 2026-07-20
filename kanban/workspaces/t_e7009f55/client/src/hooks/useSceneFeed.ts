import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SocketEvents, type DataPointBatchPayload } from '@mern-3dviz/shared';
import { useAuthStore } from '../store/auth';
import { useSceneFeedStore } from '../store/sceneFeed';

const socketPath = import.meta.env.VITE_SOCKET_PATH ?? '/socket.io';
const apiUrl = import.meta.env.VITE_API_URL ?? '';

/**
 * Manages the lifecycle of a Socket.IO connection tied to a single scene.
 * Returns the live socket for components that need direct event hooks.
 */
export function useSceneFeed(sceneId: string | null): Socket | null {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken ?? null);
  const setScene = useSceneFeedStore((s) => s.setScene);
  const appendPoints = useSceneFeedStore((s) => s.appendPoints);
  const reset = useSceneFeedStore((s) => s.reset);

  useEffect(() => {
    if (!sceneId || !accessToken) {
      reset();
      return;
    }
    setScene(sceneId);

    const sock: Socket = io(apiUrl || window.location.origin, {
      path: socketPath,
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    function onConnect() {
      sock.emit(SocketEvents.SubscribeScene, { sceneId });
    }
    function onBatch(payload: DataPointBatchPayload) {
      if (payload.sceneId !== sceneId) return;
      const points = payload.points.map((p) => ({
        _id: `${payload.dataSourceId}:${p.timestamp}:${Math.random()}`,
        dataSourceId: payload.dataSourceId,
        x: p.x, y: p.y, z: p.z,
        value: p.value,
        timestamp: p.timestamp,
      }));
      appendPoints(points);
    }

    sock.on('connect', onConnect);
    sock.on(SocketEvents.DataPointBatch, onBatch);
    sock.on(SocketEvents.DataPointAppend, onBatch);

    return () => {
      sock.emit(SocketEvents.UnsubscribeScene, { sceneId });
      sock.off('connect', onConnect);
      sock.off(SocketEvents.DataPointBatch, onBatch);
      sock.off(SocketEvents.DataPointAppend, onBatch);
      sock.disconnect();
      reset();
    };
  }, [sceneId, accessToken, setScene, appendPoints, reset]);

  return null;
}