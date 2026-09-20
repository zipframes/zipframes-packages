import { z } from "zod";

export const videoStatusSchema = z.enum([
  "AWAITING_UPLOAD",
  "QUEUED",
  "PROCESSING",
  "DONE",
  "FAILED",
  "EXPIRED",
  "DELETED",
]);

export const requestUploadRequestSchema = z.object({
  originalFileName: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export const requestUploadResponseSchema = z.object({
  videoId: z.string().uuid(),
  uploadUrl: z.string().url(),
  sourceKey: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});

export const confirmUploadResponseSchema = z.object({
  videoId: z.string().uuid(),
  status: z.literal("QUEUED"),
});

export const videoListItemSchema = z.object({
  videoId: z.string().uuid(),
  originalFileName: z.string().min(1),
  status: videoStatusSchema,
  frameCount: z.number().int().positive().nullable(),
  failureReason: z.string().nullable(),
  expiresAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listVideosResponseSchema = z.object({
  items: z.array(videoListItemSchema),
});

export const downloadResponseSchema = z.object({
  videoId: z.string().uuid(),
  downloadUrl: z.string().url(),
  expiresInSeconds: z.number().int().positive(),
});

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type RequestUploadRequest = z.infer<typeof requestUploadRequestSchema>;
export type RequestUploadResponse = z.infer<typeof requestUploadResponseSchema>;
export type ConfirmUploadResponse = z.infer<typeof confirmUploadResponseSchema>;
export type VideoListItem = z.infer<typeof videoListItemSchema>;
export type ListVideosResponse = z.infer<typeof listVideosResponseSchema>;
export type DownloadResponse = z.infer<typeof downloadResponseSchema>;
