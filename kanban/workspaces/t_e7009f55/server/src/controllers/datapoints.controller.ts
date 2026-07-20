import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import type { DataPoint, Page } from '@mern-3dviz/shared';
import { DataPointModel, type DataPointDoc } from '../models/DataPoint';
import { HttpError } from '../middleware/errors';

type DataPointLean = {
  _id: Types.ObjectId;
  dataSourceId: Types.ObjectId;
  x: number; y: number; z: number;
  value?: number | null;
  meta?: Record<string, string | number | boolean | null> | null;
  timestamp: Date;
};

function toDataPoint(doc: DataPointDoc | DataPointLean): DataPoint {
  return {
    _id: doc._id.toString(),
    dataSourceId: doc.dataSourceId.toString(),
    x: doc.x, y: doc.y, z: doc.z,
    value: doc.value ?? undefined,
    meta: doc.meta ?? undefined,
    timestamp: doc.timestamp.toISOString(),
  };
}

function parseObjectId(raw: string, field = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(raw)) throw new HttpError(400, 'validation/bad-id', `${field} is not a valid ObjectId`);
  return new Types.ObjectId(raw);
}

export async function listDataPoints(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(500, Math.max(1, Number(req.query.pageSize) || 100));
  const dataSourceId = req.query.dataSourceId as string | undefined;

  const filter: Record<string, unknown> = {};
  if (dataSourceId) filter.dataSourceId = parseObjectId(dataSourceId, 'dataSourceId');

  const [items, total] = await Promise.all([
    DataPointModel.find(filter).sort({ timestamp: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    DataPointModel.countDocuments(filter),
  ]);
  const payload: Page<DataPoint> = {
    items: items.map((d) => toDataPoint(d.toObject() as DataPointLean)),
    page,
    pageSize,
    total,
  };
  res.json(payload);
}

export async function appendDataPoint(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required');
  const { dataSourceId, x, y, z, value, meta } = req.body as { dataSourceId: string; x: number; y: number; z: number; value?: number; meta?: Record<string, string | number | boolean | null> };
  const id = parseObjectId(dataSourceId, 'dataSourceId');
  const doc = await DataPointModel.create({ dataSourceId: id, x, y, z, value, meta });
  res.status(201).json({ dataPoint: toDataPoint(doc.toObject() as DataPointLean) });
}