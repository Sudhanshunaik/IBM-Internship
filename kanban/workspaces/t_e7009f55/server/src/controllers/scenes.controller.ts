import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import type { Scene, CreateSceneRequest, UpdateSceneRequest, Page } from '@mern-3dviz/shared';
import { SceneModel, type SceneDoc } from '../models/Scene';
import { HttpError } from '../middleware/errors';

type SceneLean = {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  description?: string | null;
  dataSourceIds: Types.ObjectId[];
  camera?: { position: number[]; target: number[]; fov: number } | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toScene(doc: SceneDoc | SceneLean): Scene {
  const position = doc.camera?.position ?? [0, 0, 5];
  const target = doc.camera?.target ?? [0, 0, 0];
  const fov = doc.camera?.fov ?? 60;
  return {
    _id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    title: doc.title,
    description: doc.description ?? undefined,
    dataSourceIds: doc.dataSourceIds.map((id) => id.toString()),
    camera: {
      position: [position[0] ?? 0, position[1] ?? 0, position[2] ?? 5],
      target: [target[0] ?? 0, target[1] ?? 0, target[2] ?? 0],
      fov,
    },
    isPublic: doc.isPublic,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function parseObjectId(raw: string, field = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(raw)) throw new HttpError(400, 'validation/bad-id', `${field} is not a valid ObjectId`);
  return new Types.ObjectId(raw);
}

export async function listScenes(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const ownerId = req.query.ownerId as string | undefined;

  const filter: Record<string, unknown> = {};
  if (ownerId) {
    if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required for ownerId filter');
    filter.ownerId = parseObjectId(ownerId, 'ownerId');
    if (req.auth.sub !== ownerId) filter.isPublic = true;
  } else {
    filter.$or = [{ isPublic: true }, { ownerId: req.auth?.sub }];
  }

  const [items, total] = await Promise.all([
    SceneModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    SceneModel.countDocuments(filter),
  ]);

  const payload: Page<Scene> = {
    items: items.map((d) => toScene(d.toObject() as SceneLean)),
    page,
    pageSize,
    total,
  };
  res.json(payload);
}

export async function getScene(req: Request, res: Response): Promise<void> {
  const id = parseObjectId(req.params.id);
  const doc = await SceneModel.findById(id);
  if (!doc) throw new HttpError(404, 'scene/not-found', 'Scene not found');
  if (!doc.isPublic && doc.ownerId.toString() !== req.auth?.sub) {
    throw new HttpError(403, 'scene/forbidden', 'Not allowed to view this scene');
  }
  res.json({ scene: toScene(doc.toObject() as SceneLean) });
}

export async function createScene(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required');
  const body = req.body as CreateSceneRequest;
  const doc = await SceneModel.create({
    ownerId: new Types.ObjectId(req.auth.sub),
    title: body.title,
    description: body.description,
    dataSourceIds: (body.dataSourceIds ?? []).map((s) => parseObjectId(s, 'dataSourceIds[]')),
    camera: body.camera
      ? {
          position: (body.camera.position ?? [0, 0, 5]) as [number, number, number],
          target: (body.camera.target ?? [0, 0, 0]) as [number, number, number],
          fov: body.camera.fov ?? 60,
        }
      : undefined,
    isPublic: body.isPublic ?? false,
  });
  res.status(201).json({ scene: toScene(doc.toObject() as SceneLean) });
}

export async function updateScene(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required');
  const id = parseObjectId(req.params.id);
  const doc = await SceneModel.findById(id);
  if (!doc) throw new HttpError(404, 'scene/not-found', 'Scene not found');
  if (doc.ownerId.toString() !== req.auth.sub && req.auth.role !== 'admin') {
    throw new HttpError(403, 'scene/forbidden', 'Not allowed to modify this scene');
  }
  const body = req.body as UpdateSceneRequest;
  if (body.title !== undefined) doc.title = body.title;
  if (body.description !== undefined) doc.description = body.description;
  if (body.dataSourceIds !== undefined) {
    doc.dataSourceIds = body.dataSourceIds.map((s) => parseObjectId(s, 'dataSourceIds[]')) as unknown as Types.ObjectId[];
  }
  if (body.camera?.position && doc.camera) doc.camera.position = body.camera.position as [number, number, number];
  if (body.camera?.target && doc.camera) doc.camera.target = body.camera.target as [number, number, number];
  if (body.camera?.fov !== undefined && doc.camera) doc.camera.fov = body.camera.fov;
  if (body.isPublic !== undefined) doc.isPublic = body.isPublic;
  await doc.save();
  res.json({ scene: toScene(doc.toObject() as SceneLean) });
}

export async function deleteScene(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw new HttpError(401, 'auth/required', 'Authentication required');
  const id = parseObjectId(req.params.id);
  const doc = await SceneModel.findById(id);
  if (!doc) throw new HttpError(404, 'scene/not-found', 'Scene not found');
  if (doc.ownerId.toString() !== req.auth.sub && req.auth.role !== 'admin') {
    throw new HttpError(403, 'scene/forbidden', 'Not allowed to delete this scene');
  }
  await doc.deleteOne();
  res.status(204).end();
}