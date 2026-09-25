/** RFC 9457 Problem Details payload shared by every HTTP API in ZipFrames. */
export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly correlationId?: string;
}

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

export const problemDetails = (
  status: number,
  title: string,
  detail?: string,
  correlationId?: string,
): ProblemDetails => ({
  type: "about:blank",
  status,
  title,
  ...(detail !== undefined ? { detail } : {}),
  ...(correlationId !== undefined ? { correlationId } : {}),
});

/**
 * Problem envelope of an HTTP response: status, content type and body.
 *
 * `TStatus` keeps the literal the caller passed, so `problemResponse(409, …)`
 * still satisfies a `status: 409` member of a response union.
 */
export const problemResponse = <TStatus extends number>(
  status: TStatus,
  title: string,
  detail: string | undefined,
  correlationId: string,
) =>
  ({
    status,
    contentType: PROBLEM_CONTENT_TYPE,
    body: problemDetails(status, title, detail, correlationId),
  }) as const;
