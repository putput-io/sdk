# putput

Dead-simple file uploads. Get a URL in 3 lines of code. No signup required.

$0 egress fees. 10 GB free. Built on Cloudflare R2.

## Install

```bash
npm install putput
```

## Quick Start

```typescript
import { PutPutClient } from 'putput'

// No signup needed — get a guest token instantly
const pp = new PutPutClient()
const { token } = await pp.createGuestToken()
pp.setToken(token)

// Upload a file (handles presign + R2 upload + confirm internally)
const file = await pp.upload(
  new Blob(['hello world']),
  'hello.txt',
  'text/plain'
)

console.log(file.url) // https://cdn.putput.io/abc123/hello.txt
```

## Usage with existing token

```typescript
const pp = new PutPutClient({ token: process.env.PUTPUT_TOKEN })

const file = await pp.upload(buffer, 'photo.jpg', 'image/jpeg')
console.log(file.url)
```

## Node.js — Upload a local file

```typescript
import { readFileSync } from 'node:fs'
import { PutPutClient } from 'putput'

const pp = new PutPutClient({ token: process.env.PUTPUT_TOKEN })
const buffer = readFileSync('./photo.jpg')
const file = await pp.upload(buffer, 'photo.jpg', 'image/jpeg')
console.log(file.url)
```

## Upload from URL

```typescript
const file = await pp.uploadFromUrl('https://example.com/image.png')
console.log(file.url)
```

## Upload with options

```typescript
const file = await pp.upload(blob, 'avatar.png', 'image/png', {
  visibility: 'public',
  prefix: 'avatars',
  tags: ['user-upload', 'avatar'],
  metadata: { user_id: '123' },
  expires_at: '2026-12-31T00:00:00Z'
})
```

## List files

```typescript
const { files, has_more, cursor } = await pp.listFiles()
// With filters:
const { files } = await pp.listFiles({ prefix: 'avatars', tag: 'avatar' })
```

## Delete a file

```typescript
await pp.deleteFile(file.id)
```

## Error handling

```typescript
import { PutPutClient, PutPutError } from 'putput'

try {
  await pp.upload(largeFile, 'big.zip', 'application/zip')
} catch (err) {
  if (err instanceof PutPutError) {
    console.error(err.code)    // "FILE_TOO_LARGE"
    console.error(err.message) // "Your plan allows up to 100 MB per file"
    console.error(err.hint)    // "Upgrade to Pro at https://putput.io/upgrade"
  }
}
```

## Plans

| Plan | Storage | Max File | Expiry | Price |
|------|---------|----------|--------|-------|
| Guest | 1 GB | 100 MB | 30 days | Free, no signup |
| Free | 10 GB | 100 MB | Never | Free, email required |
| Pro | 100 GB | 500 MB | Never | $9/mo |

$0 egress on all plans.

## Environment Variables

- `PUTPUT_TOKEN` — your API token (starts with `pp_`)

## Links

- Website: https://putput.io
- Docs: https://putput.io/docs
- Dashboard: https://putput.io/dashboard
- API for AI agents: https://putput.io/llms.txt
- GitHub: https://github.com/putput-io
- CLI: `npx @putput/cli upload <file>`
