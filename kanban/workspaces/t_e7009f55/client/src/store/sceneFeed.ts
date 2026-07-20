import { create } from 'zustand';
import type { DataPoint } from '@mern-3dviz/shared';

/**
 * Live point buffer for the active 3D scene.
 *
 * The hook `useSceneFeed` pushes new batches from Socket.IO into this store;
 * the Three.js component subscribes to `points` and re-renders.
 */

interface SceneFeedState {
  sceneId: string | null;
  points: DataPoint[];
  lastReceivedAt: string | null;
  setScene: (sceneId: string | null) => void;
  appendPoints: (incoming: DataPoint[]) => void;
  reset: () => void;
}

const MAX_POINTS = 5000;

export const useSceneFeedStore = create<SceneFeedState>((set) => ({
  sceneId: null,
  points: [],
  lastReceivedAt: null,

  setScene: (sceneId) => set({ sceneId, points: [], lastReceivedAt: null }),

  appendPoints: (incoming) =>
    set((state) => {
      const next = [...incoming, ...state.points];
      if (next.length > MAX_POINTS) next.length = MAX_POINTS;
      return { points: next, lastReceivedAt: new Date().toISOString() };
    }),

  reset: () => set({ sceneId: null, points: [], lastReceivedAt: null }),
}));