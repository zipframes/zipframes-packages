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

/** Path parameter of every `/videos/{videoId}` route. */
export const videoIdParamsSchema = z.object({
  videoId: z.uuid(),
});

export const DEFAULT_VIDEO_PAGE_SIZE = 20;
export const MAX_VIDEO_PAGE_SIZE = 100;

/**
 * Query string of `GET /videos`. The list is newest first; the next page is
 * asked with `before` set to the `createdAt` of the last item received.
 */
export const listVideosQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_VIDEO_PAGE_SIZE).default(DEFAULT_VIDEO_PAGE_SIZE),
  before: z.iso.datetime().optional(),
});

/** `GET /videos/{videoId}` answers the same shape as one list item. */
export const getVideoResponseSchema = videoListItemSchema;

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
export type VideoIdParams = z.infer<typeof videoIdParamsSchema>;
export type ListVideosQuery = z.infer<typeof listVideosQuerySchema>;
export type GetVideoResponse = z.infer<typeof getVideoResponseSchema>;
export type DownloadResponse = z.infer<typeof downloadResponseSchema>;
