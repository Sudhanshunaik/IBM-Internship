import { Types } from 'mongoose';
import type { DataPointBatchPayload } from '@mern-3dviz/shared';
import { DataSourceModel } from '../models/DataSource';
import { DataPointModel } from '../models/DataPoint';
import { realtime } from '../sockets';

/**
 * Demo simulator: walks the scene's data sources and emits a small batch of random
 * points every tick. Real production code would have an API-polling worker here.
 *
 * This is intentionally lightweight — it exists so the real-time channel has data
 * to broadcast during local development and tests.
 */

interface ActiveSource {
  sceneId: Types.ObjectId;
  dataSourceId: Types.ObjectId;
  intervalMs: number;
  timer: NodeJS.Timeout;
}

const active = new Map<string, ActiveSource>();

export async function startSimulator(sceneId: Types.ObjectId): Promise<void> {
  const scene = await DataSourceModel.find({ /* placeholder filter below */ }).lean();
  // We need scenes, not data sources — resolve through SceneModel:
  const { SceneModel } = await import('../models/Scene');
  const sceneDoc = await SceneModel.findById(sceneId).lean();
  if (!sceneDoc) return;
  for (const dsId of sceneDoc.dataSourceIds) {
    const key = `${sceneId.toString()}:${dsId.toString()}`;
    if (active.has(key)) continue;
    const ds = await DataSourceModel.findById(dsId).lean();
    const intervalMs = ds?.pollIntervalMs ?? 2000;
    const timer = setInterval(() => {
      void emitBatch(sceneId, dsId, 5);
    }, intervalMs);
    active.set(key, { sceneId, dataSourceId: dsId, intervalMs, timer });
  }
  // silence unused-var warning
  void scene;
}

export function stopSimulator(sceneId: Types.ObjectId): void {
  for (const [key, entry] of active.entries()) {
    if (entry.sceneId.equals(sceneId)) {
      clearInterval(entry.timer);
      active.delete(key);
    }
  }
}

async function emitBatch(sceneId: Types.ObjectId, dataSourceId: Types.ObjectId, n: number): Promise<void> {
  const now = new Date();
  const docs = Array.from({ length: n }, () => ({
    dataSourceId,
    x: (Math.random() - 0.5) * 10,
    y: (Math.random() - 0.5) * 10,
    z: (Math.random() - 0.5) * 10,
    value: Math.random(),
    timestamp: now,
  }));
  await DataPointModel.insertMany(docs);
  const payload: DataPointBatchPayload = {
    sceneId: sceneId.toString(),
    dataSourceId: dataSourceId.toString(),
    points: docs.map((d) => ({
      x: d.x, y: d.y, z: d.z, value: d.value,
      timestamp: d.timestamp.toISOString(),
    })),
    receivedAt: now.toISOString(),
  };
  realtime.emitDataPointBatch(payload);
}