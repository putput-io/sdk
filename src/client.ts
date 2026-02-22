import { PutPutError } from "./errors.js";

// ─── Types ───

/**
 * Options for constructing a {@link PutPutClient}.
 */
export interface PutPutClientOptions {
  /** API bearer token (starts with `pp_`). Get one at https://putput.io or call {@link PutPutClient.createGuestToken}. */
  token?: string;
  /** Base URL of the PutPut API. Defaults to `"https://putput.io"`. Only override for self-hosted or local dev. */
  baseUrl?: string;
}

/**
 * Response from {@link PutPutClient.createGuestToken}.
 * Contains the guest token string and the account limits for guest accounts.
 */
export interface GuestTokenResponse {
  /** The guest bearer token (starts with `pp_guest_`). Pass to {@link PutPutClient.setToken} or the constructor. */
  token: string;
  /** URL where the guest can claim (upgrade) their account by providing an email. */
  claim_url: string;
  /** Resource limits for this guest account. */
  limits: {
    /** Maximum total storage in bytes (e.g. 1073741824 = 1 GB). */
    storage_bytes: number;
    /** Maximum size of a single file upload in bytes (e.g. 104857600 = 100 MB). */
    max_file_size_bytes: number;
    /** Maximum number of files the guest can upload. */
    max_files: number;
    /** ISO 8601 datetime when the guest account and its files expire. */
    expires_at: string;
  };
}

/**
 * A file stored in PutPut. Returned by {@link PutPutClient.listFiles} and internally after upload confirmation.
 */
export interface FileItem {
  /** Unique file identifier (UUID). Use this for {@link PutPutClient.deleteFile}, {@link PutPutClient.downloadFile}, etc. */
  id: string;
  /** Original filename as provided during upload (e.g. `"photo.jpg"`). */
  original_name: string;
  /** Server-assigned unique filename used in the CDN URL (e.g. `"abc123_photo.jpg"`). */
  public_name: string;
  /** Public CDN URL. `null` for private files -- use {@link PutPutClient.downloadFile} to get a presigned URL. */
  public_url: string | null;
  /** MIME type of the file (e.g. `"image/jpeg"`). */
  content_type: string;
  /** File size in bytes. */
  size_bytes: number;
  /** File visibility: `"public"` or `"private"`. */
  visibility: string;
  /** Path prefix for file organization (e.g. `"avatars"`). `null` if no prefix was set. */
  prefix: string | null;
  /** User-defined key-value metadata. `null` if no metadata was set. Max 10 keys. */
  metadata: Record<string, string> | null;
  /** User-defined tags for categorization. `null` if no tags were set. Max 10 tags. */
  tags: string[] | null;
  /** Number of times this file has been downloaded. */
  download_count: number;
  /** Short URL for sharing (e.g. `"https://putput.io/s/abc"`). `null` if not generated. */
  short_url: string | null;
  /** ISO 8601 datetime when this file expires and will be deleted. `null` if the file does not expire. */
  expires_at: string | null;
  /** ISO 8601 datetime when this file was uploaded. */
  created_at: string;
}

/**
 * Paginated response from {@link PutPutClient.listFiles}.
 */
export interface FileListResponse {
  /** Array of files matching the query. */
  files: FileItem[];
  /** Opaque cursor string for fetching the next page. `null` if there are no more pages. Pass to {@link ListFilesOptions.cursor}. */
  cursor: string | null;
  /** `true` if there are more files beyond this page. */
  has_more: boolean;
}

/**
 * Options for {@link PutPutClient.upload}. All fields are optional.
 */
export interface UploadOptions {
  /** File visibility: `"public"` (default, gets a CDN URL) or `"private"` (requires presigned URL to access). */
  visibility?: "public" | "private";
  /** Optional path prefix for organizing files (e.g. `"avatars"`, `"documents/2026"`). */
  prefix?: string;
  /** Optional key-value metadata attached to the file. Max 10 keys, string values only. */
  metadata?: Record<string, string>;
  /** Optional tags for categorization and filtering. Max 10 tags, 50 chars each. */
  tags?: string[];
  /** Optional ISO 8601 datetime when the file should be automatically deleted (e.g. `"2026-12-31T00:00:00Z"`). */
  expires_at?: string;
}

/**
 * Result returned from {@link PutPutClient.upload} and {@link PutPutClient.uploadFromUrl}.
 */
export interface UploadResult {
  /** Unique file identifier (UUID). Use for subsequent API calls like {@link PutPutClient.deleteFile}. */
  id: string;
  /** Public CDN URL for the uploaded file. `null` if visibility is `"private"`. */
  url: string | null;
  /** Original filename as provided during upload. */
  original_name: string;
  /** Server-assigned unique filename used in the CDN URL. */
  public_name: string;
  /** MIME type of the file (e.g. `"image/jpeg"`). */
  content_type: string;
  /** File size in bytes. */
  size_bytes: number;
  /** File visibility: `"public"` or `"private"`. */
  visibility: string;
  /** Short URL for sharing. `null` if not generated. */
  short_url: string | null;
  /** Tags assigned to this file. `null` if none were provided. */
  tags: string[] | null;
  /** Key-value metadata assigned to this file. `null` if none was provided. */
  metadata: Record<string, string> | null;
}

/**
 * Options for {@link PutPutClient.listFiles}. All fields are optional.
 */
export interface ListFilesOptions {
  /** Opaque cursor from a previous {@link FileListResponse} for fetching the next page. */
  cursor?: string;
  /** Filter files by prefix (e.g. `"avatars"`). */
  prefix?: string;
  /** Filter files by project ID. */
  project_id?: string;
  /** Filter files by tag (e.g. `"user-upload"`). */
  tag?: string;
  /** Number of files per page (1--100). Defaults to 50. */
  limit?: number;
}

/**
 * Result from {@link PutPutClient.downloadFile}. Contains a URL to download the file.
 */
export interface DownloadResult {
  /** Download URL. For public files this is the CDN URL; for private files this is a time-limited presigned URL. */
  download_url: string;
  /** ISO 8601 datetime when the presigned URL expires. Only present for private files. */
  expires_at?: string;
}

/**
 * Stats for a single file, returned by {@link PutPutClient.getFileStats}.
 */
export interface FileStats {
  /** Unique file identifier (UUID). */
  id: string;
  /** Total number of times this file has been downloaded. */
  download_count: number;
  /** File size in bytes. */
  size_bytes: number;
  /** File visibility: `"public"` or `"private"`. */
  visibility: string;
  /** ISO 8601 datetime when this file was uploaded. */
  created_at: string;
}

/**
 * Options for {@link PutPutClient.uploadFromUrl}. All fields are optional.
 */
export interface UploadFromUrlOptions {
  /** Override the filename (otherwise inferred from the URL path). */
  filename?: string;
  /** Override the MIME content type (otherwise inferred by the server). */
  content_type?: string;
  /** File visibility: `"public"` (default) or `"private"`. */
  visibility?: "public" | "private";
  /** Optional path prefix for organizing files. */
  prefix?: string;
  /** Optional key-value metadata attached to the file. Max 10 keys, string values only. */
  metadata?: Record<string, string>;
  /** Optional tags for categorization and filtering. Max 10 tags, 50 chars each. */
  tags?: string[];
  /** Optional ISO 8601 datetime when the file should be automatically deleted. */
  expires_at?: string;
}

/**
 * A single entry in the account activity log, returned by {@link PutPutClient.getActivity}.
 */
export interface ActivityItem {
  /** Unique activity entry identifier. */
  id: string;
  /** Action performed (e.g. `"upload"`, `"delete"`, `"download"`). */
  action: string;
  /** ID of the resource (file, webhook, etc.) involved. `null` for account-level actions. */
  resource_id: string | null;
  /** IP address that initiated the action. `null` if not recorded. */
  ip_address: string | null;
  /** ISO 8601 datetime when the action occurred. */
  created_at: string;
}

/**
 * Paginated response from {@link PutPutClient.getActivity}.
 */
export interface ActivityResponse {
  /** Array of activity entries, newest first. */
  activity: ActivityItem[];
  /** Opaque cursor for fetching the next page. `null` if there are no more pages. */
  cursor: string | null;
  /** `true` if there are more entries beyond this page. */
  has_more: boolean;
}

/**
 * A webhook configuration, returned by {@link PutPutClient.listWebhooks} and {@link PutPutClient.createWebhook}.
 */
export interface WebhookItem {
  /** Unique webhook identifier (UUID). */
  id: string;
  /** The URL that receives webhook POST requests. */
  url: string;
  /** Event types this webhook is subscribed to (e.g. `["upload", "delete"]`). */
  events: string[];
  /** Whether this webhook is currently active. */
  active: boolean;
  /** ISO 8601 datetime when this webhook was created. */
  created_at: string;
}

/**
 * A project for organizing files, returned by {@link PutPutClient.listProjects} and {@link PutPutClient.createProject}.
 */
export interface ProjectItem {
  /** Unique project identifier (UUID). */
  id: string;
  /** Human-readable project name. */
  name: string;
  /** ISO 8601 datetime when this project was created. */
  created_at: string;
}

/**
 * Full account data export, returned by {@link PutPutClient.exportData}.
 */
export interface AccountExport {
  /** User profile information. */
  user: Record<string, unknown>;
  /** All API tokens associated with the account. */
  tokens: Record<string, unknown>[];
  /** All files associated with the account. */
  files: Record<string, unknown>[];
}

// ─── Client ───

const DEFAULT_BASE_URL = "https://putput.io";

/**
 * PutPut SDK client. Handles authentication, file uploads (3-step presign flow),
 * listing, deletion, webhooks, projects, and account management.
 *
 * @example Basic usage with guest token
 * ```typescript
 * import { PutPutClient } from 'putput'
 *
 * const pp = new PutPutClient()
 * const { token } = await pp.createGuestToken()
 * pp.setToken(token)
 *
 * const file = await pp.upload(new Blob(['hello']), 'hello.txt', 'text/plain')
 * console.log(file.url)
 * ```
 *
 * @example Usage with existing token
 * ```typescript
 * const pp = new PutPutClient({ token: process.env.PUTPUT_TOKEN })
 * const file = await pp.upload(buffer, 'photo.jpg', 'image/jpeg')
 * console.log(file.url)
 * ```
 */
export class PutPutClient {
  private readonly baseUrl: string;
  private token: string | undefined;

  /**
   * Create a new PutPutClient.
   *
   * @param options - Client configuration. All fields are optional.
   *
   * @example No-signup guest flow
   * ```typescript
   * const pp = new PutPutClient()
   * ```
   *
   * @example With an existing token
   * ```typescript
   * const pp = new PutPutClient({ token: 'pp_abc123...' })
   * ```
   */
  constructor(options: PutPutClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.token = options.token;
  }

  /**
   * Set or update the bearer token after construction.
   * Call this after {@link createGuestToken} to authenticate subsequent requests.
   *
   * @param token - API bearer token (starts with `pp_`).
   *
   * @example
   * ```typescript
   * const pp = new PutPutClient()
   * const { token } = await pp.createGuestToken()
   * pp.setToken(token)
   * ```
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Create a guest token. No authentication required.
   * Guest accounts get 1 GB storage, 100 MB max file size, and files expire after 30 days.
   * Claim the account later by visiting the returned `claim_url` to keep files permanently.
   *
   * @returns Guest token, claim URL, and account limits.
   * @throws {PutPutError} If the API returns an error (e.g. rate limited).
   *
   * @example
   * ```typescript
   * const pp = new PutPutClient()
   * const { token, claim_url, limits } = await pp.createGuestToken()
   * pp.setToken(token)
   * console.log(`Storage limit: ${limits.storage_bytes} bytes`)
   * ```
   */
  async createGuestToken(): Promise<GuestTokenResponse> {
    const res = await this.fetch("/api/v1/auth/guest", {
      method: "POST",
    });
    return res as GuestTokenResponse;
  }

  /**
   * Upload a file. Handles the full 3-step flow internally:
   * 1. `POST /api/v1/upload/presign` -- get a presigned R2 URL
   * 2. `PUT` to the presigned URL -- upload bytes directly to Cloudflare R2
   * 3. `POST /api/v1/upload/confirm` -- finalize and get the CDN URL
   *
   * The file never passes through PutPut servers -- it goes directly to R2.
   *
   * @param file - The file data as a `Blob`, `ArrayBuffer`, or `Uint8Array`.
   * @param filename - Desired filename (e.g. `"photo.jpg"`). The server may add a unique prefix.
   * @param contentType - MIME type (e.g. `"image/jpeg"`). Defaults to `"application/octet-stream"`.
   * @param options - Optional upload settings: visibility, prefix, metadata, tags, expiry.
   * @returns Upload result with the file ID, CDN URL, and metadata.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"FILE_TOO_LARGE"` if the file exceeds the plan limit.
   * @throws {PutPutError} With code `"QUOTA_EXCEEDED"` if storage quota is full.
   * @throws {PutPutError} With code `"R2_UPLOAD_FAILED"` if the R2 PUT request fails.
   *
   * @example Upload a Blob
   * ```typescript
   * const file = await pp.upload(
   *   new Blob(['hello world']),
   *   'hello.txt',
   *   'text/plain'
   * )
   * console.log(file.url) // https://cdn.putput.io/abc123/hello.txt
   * ```
   *
   * @example Upload with options
   * ```typescript
   * const file = await pp.upload(blob, 'avatar.png', 'image/png', {
   *   visibility: 'public',
   *   prefix: 'avatars',
   *   tags: ['user-upload'],
   *   metadata: { user_id: '123' },
   *   expires_at: '2026-12-31T00:00:00Z'
   * })
   * ```
   */
  async upload(
    file: Blob | ArrayBuffer | Uint8Array,
    filename: string,
    contentType?: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    this.requireToken();

    const resolvedContentType = contentType ?? "application/octet-stream";

    let sizeBytes: number;
    if (file instanceof Blob) {
      sizeBytes = file.size;
    } else if (file instanceof ArrayBuffer) {
      sizeBytes = file.byteLength;
    } else {
      sizeBytes = file.byteLength;
    }

    // Step 1: Presign
    const presignBody: Record<string, unknown> = {
      filename,
      content_type: resolvedContentType,
      size_bytes: sizeBytes,
    };
    if (options?.visibility) presignBody.visibility = options.visibility;
    if (options?.prefix) presignBody.prefix = options.prefix;
    if (options?.metadata) presignBody.metadata = options.metadata;
    if (options?.tags) presignBody.tags = options.tags;
    if (options?.expires_at) presignBody.expires_at = options.expires_at;

    const presign = (await this.fetch("/api/v1/upload/presign", {
      method: "POST",
      body: JSON.stringify(presignBody),
    })) as {
      upload_id: string;
      presigned_url: string;
      public_name: string;
      expires_at: string;
    };

    // Step 2: PUT to R2
    const putRes = await globalThis.fetch(presign.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": resolvedContentType },
      body: file as BodyInit,
    });

    if (!putRes.ok) {
      throw new PutPutError(putRes.status, {
        code: "R2_UPLOAD_FAILED",
        message: `R2 upload failed with status ${putRes.status}`,
        hint: "The presigned URL may have expired. Try again.",
      });
    }

    // Step 3: Confirm
    const confirm = (await this.fetch("/api/v1/upload/confirm", {
      method: "POST",
      body: JSON.stringify({ upload_id: presign.upload_id }),
    })) as {
      file: FileItem;
    };

    return {
      id: confirm.file.id,
      url: confirm.file.public_url,
      original_name: confirm.file.original_name,
      public_name: confirm.file.public_name,
      content_type: confirm.file.content_type,
      size_bytes: confirm.file.size_bytes,
      visibility: confirm.file.visibility,
      short_url: confirm.file.short_url,
      tags: confirm.file.tags,
      metadata: confirm.file.metadata,
    };
  }

  /**
   * Upload a file from a URL. The PutPut server fetches the file directly from the given URL,
   * so you don't need to download it locally first. Useful for mirroring images, importing assets, etc.
   *
   * @param url - The source URL to fetch the file from (e.g. `"https://example.com/image.png"`).
   * @param options - Optional settings: filename override, content type, visibility, prefix, metadata, tags, expiry.
   * @returns Upload result with the file ID, CDN URL, and metadata.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"FILE_TOO_LARGE"` if the fetched file exceeds the plan limit.
   * @throws {PutPutError} With code `"INVALID_URL"` if the URL is unreachable or invalid.
   *
   * @example
   * ```typescript
   * const file = await pp.uploadFromUrl('https://example.com/image.png')
   * console.log(file.url) // https://cdn.putput.io/abc123/image.png
   * ```
   *
   * @example With options
   * ```typescript
   * const file = await pp.uploadFromUrl('https://example.com/photo.jpg', {
   *   filename: 'my-photo.jpg',
   *   visibility: 'private',
   *   tags: ['imported']
   * })
   * ```
   */
  async uploadFromUrl(url: string, options?: UploadFromUrlOptions): Promise<UploadResult> {
    this.requireToken();

    const body: Record<string, unknown> = { url };
    if (options?.filename) body.filename = options.filename;
    if (options?.content_type) body.content_type = options.content_type;
    if (options?.visibility) body.visibility = options.visibility;
    if (options?.prefix) body.prefix = options.prefix;
    if (options?.metadata) body.metadata = options.metadata;
    if (options?.tags) body.tags = options.tags;
    if (options?.expires_at) body.expires_at = options.expires_at;

    const result = (await this.fetch("/api/v1/upload/url", {
      method: "POST",
      body: JSON.stringify(body),
    })) as { file: FileItem };

    return {
      id: result.file.id,
      url: result.file.public_url,
      original_name: result.file.original_name,
      public_name: result.file.public_name,
      content_type: result.file.content_type,
      size_bytes: result.file.size_bytes,
      visibility: result.file.visibility,
      short_url: result.file.short_url,
      tags: result.file.tags,
      metadata: result.file.metadata,
    };
  }

  /**
   * Get a download URL for a file. Public files return the CDN URL; private files return
   * a time-limited presigned URL.
   *
   * @param id - The file ID (UUID) to download.
   * @returns An object containing the download URL and optional expiry for presigned URLs.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"NOT_FOUND"` if the file does not exist or is not owned by this account.
   *
   * @example
   * ```typescript
   * const { download_url } = await pp.downloadFile('file-uuid-here')
   * console.log(download_url) // CDN URL or presigned URL
   * ```
   */
  async downloadFile(id: string): Promise<DownloadResult> {
    this.requireToken();
    return (await this.fetch(`/api/v1/files/${encodeURIComponent(id)}/download`, {
      method: "GET",
    })) as DownloadResult;
  }

  /**
   * Get stats for a file, including download count, size, and visibility.
   *
   * @param id - The file ID (UUID) to get stats for.
   * @returns File statistics including download count, size, visibility, and creation date.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"NOT_FOUND"` if the file does not exist or is not owned by this account.
   *
   * @example
   * ```typescript
   * const stats = await pp.getFileStats('file-uuid-here')
   * console.log(`Downloaded ${stats.download_count} times`)
   * ```
   */
  async getFileStats(id: string): Promise<FileStats> {
    this.requireToken();
    return (await this.fetch(`/api/v1/files/${encodeURIComponent(id)}/stats`, {
      method: "GET",
    })) as FileStats;
  }

  /**
   * List uploaded files with cursor-based pagination and optional filters.
   * Returns up to `limit` files per page (default 50, max 100).
   *
   * @param options - Optional pagination and filter settings.
   * @returns Paginated list of files with a cursor for the next page.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   *
   * @example List all files
   * ```typescript
   * const { files, has_more, cursor } = await pp.listFiles()
   * ```
   *
   * @example With filters
   * ```typescript
   * const { files } = await pp.listFiles({ prefix: 'avatars', tag: 'avatar', limit: 20 })
   * ```
   *
   * @example Paginate through all files
   * ```typescript
   * let cursor: string | null = null
   * do {
   *   const page = await pp.listFiles({ cursor: cursor ?? undefined })
   *   for (const file of page.files) console.log(file.public_url)
   *   cursor = page.cursor
   * } while (cursor)
   * ```
   */
  async listFiles(options?: ListFilesOptions): Promise<FileListResponse> {
    this.requireToken();

    const params = new URLSearchParams();
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.prefix) params.set("prefix", options.prefix);
    if (options?.project_id) params.set("project_id", options.project_id);
    if (options?.tag) params.set("tag", options.tag);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    const path = `/api/v1/files${qs ? `?${qs}` : ""}`;

    return (await this.fetch(path, { method: "GET" })) as FileListResponse;
  }

  /**
   * Delete a file by ID. This permanently removes the file from storage and cannot be undone.
   *
   * @param id - The file ID (UUID) to delete.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"NOT_FOUND"` if the file does not exist or is not owned by this account.
   *
   * @example
   * ```typescript
   * await pp.deleteFile('file-uuid-here')
   * ```
   */
  async deleteFile(id: string): Promise<void> {
    this.requireToken();
    await this.fetch(`/api/v1/files/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  /**
   * Get the account activity log with cursor-based pagination. Returns actions like
   * uploads, deletions, and downloads, newest first.
   *
   * @param options - Optional pagination settings.
   * @returns Paginated list of activity entries.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   *
   * @example
   * ```typescript
   * const { activity, has_more } = await pp.getActivity({ limit: 20 })
   * for (const entry of activity) {
   *   console.log(`${entry.action} at ${entry.created_at}`)
   * }
   * ```
   */
  async getActivity(options?: { cursor?: string; limit?: number }): Promise<ActivityResponse> {
    this.requireToken();
    const params = new URLSearchParams();
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return (await this.fetch(`/api/v1/dashboard/activity${qs ? `?${qs}` : ""}`, {
      method: "GET",
    })) as ActivityResponse;
  }

  /**
   * List all webhooks configured on this account.
   *
   * @returns An object containing an array of webhook configurations.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   *
   * @example
   * ```typescript
   * const { webhooks } = await pp.listWebhooks()
   * for (const wh of webhooks) {
   *   console.log(`${wh.url} listens for ${wh.events.join(', ')}`)
   * }
   * ```
   */
  async listWebhooks(): Promise<{ webhooks: WebhookItem[] }> {
    this.requireToken();
    return (await this.fetch("/api/v1/dashboard/webhooks", {
      method: "GET",
    })) as { webhooks: WebhookItem[] };
  }

  /**
   * Create a new webhook. The provided URL will receive POST requests when the specified events occur.
   *
   * @param url - The HTTPS URL to receive webhook POST requests.
   * @param events - Optional array of event types to subscribe to (e.g. `["upload", "delete"]`). Defaults to all events.
   * @returns The newly created webhook configuration.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"INVALID_URL"` if the webhook URL is invalid.
   *
   * @example
   * ```typescript
   * const { webhook } = await pp.createWebhook('https://example.com/webhook', ['upload'])
   * console.log(webhook.id) // use this to delete later
   * ```
   */
  async createWebhook(url: string, events?: string[]): Promise<{ webhook: WebhookItem }> {
    this.requireToken();
    const body: Record<string, unknown> = { url };
    if (events) body.events = events;
    return (await this.fetch("/api/v1/dashboard/webhooks", {
      method: "POST",
      body: JSON.stringify(body),
    })) as { webhook: WebhookItem };
  }

  /**
   * Delete a webhook by ID. Stops all future event deliveries to that URL.
   *
   * @param id - The webhook ID (UUID) to delete.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"NOT_FOUND"` if the webhook does not exist.
   *
   * @example
   * ```typescript
   * await pp.deleteWebhook('webhook-uuid-here')
   * ```
   */
  async deleteWebhook(id: string): Promise<void> {
    this.requireToken();
    await this.fetch(`/api/v1/dashboard/webhooks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  /**
   * List all projects in this account. Projects are used to organize files into logical groups.
   *
   * @returns An object containing an array of projects.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   *
   * @example
   * ```typescript
   * const { projects } = await pp.listProjects()
   * for (const p of projects) console.log(p.name)
   * ```
   */
  async listProjects(): Promise<{ projects: ProjectItem[] }> {
    this.requireToken();
    return (await this.fetch("/api/v1/dashboard/projects", {
      method: "GET",
    })) as { projects: ProjectItem[] };
  }

  /**
   * Create a new project for organizing files.
   *
   * @param name - Human-readable project name.
   * @returns The newly created project.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   *
   * @example
   * ```typescript
   * const { project } = await pp.createProject('Marketing Assets')
   * console.log(project.id) // use when uploading files to this project
   * ```
   */
  async createProject(name: string): Promise<{ project: ProjectItem }> {
    this.requireToken();
    return (await this.fetch("/api/v1/dashboard/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    })) as { project: ProjectItem };
  }

  /**
   * Delete a project by ID. Files in the project are not deleted, only the project grouping is removed.
   *
   * @param id - The project ID (UUID) to delete.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   * @throws {PutPutError} With code `"NOT_FOUND"` if the project does not exist.
   *
   * @example
   * ```typescript
   * await pp.deleteProject('project-uuid-here')
   * ```
   */
  async deleteProject(id: string): Promise<void> {
    this.requireToken();
    await this.fetch(`/api/v1/dashboard/projects/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  /**
   * Export all account data including user profile, tokens, and files.
   * Useful for GDPR data portability requests.
   *
   * @returns Full account data export.
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   *
   * @example
   * ```typescript
   * const data = await pp.exportData()
   * console.log(`${data.files.length} files exported`)
   * ```
   */
  async exportData(): Promise<AccountExport> {
    this.requireToken();
    return (await this.fetch("/api/v1/account/export", {
      method: "GET",
    })) as AccountExport;
  }

  /**
   * Permanently delete this account and all associated data (files, tokens, webhooks, projects).
   * This action cannot be undone.
   *
   * @throws {PutPutError} With code `"NO_TOKEN"` if no token is set.
   *
   * @example
   * ```typescript
   * // WARNING: This permanently deletes everything!
   * await pp.deleteAccount()
   * ```
   */
  async deleteAccount(): Promise<void> {
    this.requireToken();
    await this.fetch("/api/v1/account", {
      method: "DELETE",
    });
  }

  // ─── Internal ───

  private requireToken(): void {
    if (!this.token) {
      throw new PutPutError(0, {
        code: "NO_TOKEN",
        message: "A token is required for this operation. Pass it in the constructor or call setToken().",
      });
    }
  }

  private async fetch(
    path: string,
    init: { method: string; body?: string },
  ): Promise<unknown> {
    const headers: Record<string, string> = {};

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (init.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await globalThis.fetch(`${this.baseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body,
    });

    // 204 No Content (e.g. delete)
    if (res.status === 204) {
      return undefined;
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      if (!res.ok) {
        throw new PutPutError(res.status, {
          code: "UNKNOWN_ERROR",
          message: `Request failed with status ${res.status}`,
        });
      }
      return undefined;
    }

    if (!res.ok) {
      const body = json as { error?: { code?: string; message?: string; hint?: string } };
      const err = body?.error;
      throw new PutPutError(res.status, {
        code: err?.code ?? "UNKNOWN_ERROR",
        message: err?.message ?? `Request failed with status ${res.status}`,
        hint: err?.hint,
      });
    }

    return json;
  }
}
