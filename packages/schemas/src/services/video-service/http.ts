import { z } from "zod";

export const videoStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "DONE",
  "FAILED",
  "EXPIRED",
  "DELETED",
]);

/**
 * Answer of `POST /videos`, which receives the file as multipart/form-data
 * (one `file` field) and queues it for processing in the same request.
 */
export const uploadVideoResponseSchema = z.object({
  videoId: z.uuid(),
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

/** Statuses `GET /videos` can filter by: deleted videos are never listed. */
export const listableVideoStatusSchema = videoStatusSchema.exclude(["DELETED"]);

/**
 * Query string of `GET /videos`. The list is newest first; the next page is
 * asked with `before` set to the `createdAt` of the last item received, and
 * `status` keeps only the videos in that status.
 */
export const listVideosQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_VIDEO_PAGE_SIZE).default(DEFAULT_VIDEO_PAGE_SIZE),
  before: z.iso.datetime().optional(),
  status: listableVideoStatusSchema.optional(),
});

/** `GET /videos/{videoId}` answers the same shape as one list item. */
export const getVideoResponseSchema = videoListItemSchema;

export const downloadResponseSchema = z.object({
  videoId: z.string().uuid(),
  downloadUrl: z.string().url(),
  expiresInSeconds: z.number().int().positive(),
});

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type ListableVideoStatus = z.infer<typeof listableVideoStatusSchema>;
export type UploadVideoResponse = z.infer<typeof uploadVideoResponseSchema>;
export type VideoListItem = z.infer<typeof videoListItemSchema>;
export type ListVideosResponse = z.infer<typeof listVideosResponseSchema>;
export type VideoIdParams = z.infer<typeof videoIdParamsSchema>;
export type ListVideosQuery = z.infer<typeof listVideosQuerySchema>;
export type GetVideoResponse = z.infer<typeof getVideoResponseSchema>;
export type DownloadResponse = z.infer<typeof downloadResponseSchema>;
