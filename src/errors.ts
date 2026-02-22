/**
 * Error thrown by PutPutClient when the API returns an error response.
 * Wraps the canonical error shape: { error: { code, message, hint } }
 */
export class PutPutError extends Error {
  /** SCREAMING_SNAKE error code from the API */
  readonly code: string;
  /** Optional hint suggesting what to do next */
  readonly hint: string | undefined;
  /** HTTP status code */
  readonly status: number;

  constructor(status: number, body: { code: string; message: string; hint?: string }) {
    super(body.message);
    this.name = "PutPutError";
    this.code = body.code;
    this.hint = body.hint;
    this.status = status;
  }
}
