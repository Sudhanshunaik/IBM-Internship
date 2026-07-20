import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import type { DataSource, CreateDataSourceRequest, Page } from '@mern-3dviz/shared';
import { DataSourceModel, type DataSourceDoc } from '../models/DataSource';
import { HttpError } from '../middleware/errors';

type DataSourceLean = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  kind: 'sensor' | 'api-poll' | 'manual';
  pollIntervalMs?: number | null;
  endpoint?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDataSource(doc: DataSourceDoc | DataSourceLean): DataSource {
  return {
    _id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    name: doc.name,
    kind: doc.kind,
    pollIntervalMs: doc.pollIntervalMs ?? undefined,
    endpoint: doc.endpoint ?? undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function parseObjectId(raw: string, field = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(raw)) throw new HttpError(400, 'validation/bad-id', `${field} is not a valid ObjectId`);
  return new Types.ObjectId(raw);
}

export async function listDataSources(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required');
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const filter = { ownerId: new Types.ObjectId(req.auth.sub) };
  const [items, total] = await Promise.all([
    DataSourceModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    DataSourceModel.countDocuments(filter),
  ]);
  const payload: Page<DataSource> = {
    items: items.map((d) => toDataSource(d.toObject() as DataSourceLean)),
    page,
    pageSize,
    total,
  };
  res.json(payload);
}

export async function createDataSource(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required');
  const body = req.body as CreateDataSourceRequest;
  const doc = await DataSourceModel.create({
    ownerId: new Types.ObjectId(req.auth.sub),
    name: body.name,
    kind: body.kind,
    pollIntervalMs: body.pollIntervalMs,
    endpoint: body.endpoint,
  });
  res.status(201).json({ dataSource: toDataSource(doc.toObject() as DataSourceLean) });
}

export async function deleteDataSource(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required');
  const id = parseObjectId(req.params.id);
  const doc = await DataSourceModel.findById(id);
  if (!doc) throw new HttpError(404, 'datasource/not-found', 'Data source not found');
  if (doc.ownerId.toString() !== req.auth.sub && req.auth.role !== 'admin') {
    throw new HttpError(403, 'datasource/forbidden', 'Not allowed to delete this data source');
  }
  await doc.deleteOne();
  res.status(204).end();
}