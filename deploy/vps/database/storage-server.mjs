// Stand-in for the part of Supabase Storage that America Econ uses, so post
// images live on the VPS disk:
//
//   POST|PUT /storage/v1/object/<bucket>/<path>   upload (raw body or the
//                                                 multipart form supabase-js sends)
//   GET|HEAD /storage/v1/object/public/<bucket>/<path>
//
// Adapted from Frontier's storage server. Uploads come from the admin pages in
// the browser with the site's anon key; nginx asks for the admin password
// before any upload reaches this server (deploy/vps/nginx.conf).
//
// Environment:
//   STORAGE_ROOT          files go to <root>/<bucket>/<path> (default /var/lib/americaecon-storage)
//   STORAGE_BUCKETS       buckets that accept uploads (default post-images)
//   STORAGE_SERVICE_KEY   the bearer token uploads must present (the site's anon key)
//   STORAGE_MAX_BYTES     largest upload (default 10 MB)
//   HOST, PORT            default 127.0.0.1:54393
import http from 'node:http'
import { createReadStream } from 'node:fs'
import { mkdir, open, rename, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID, timingSafeEqual } from 'node:crypto'

const ROOT = path.resolve(process.env.STORAGE_ROOT || '/var/lib/americaecon-storage')
const BUCKETS = new Set(String(process.env.STORAGE_BUCKETS || 'post-images').split(',').map((b) => b.trim()).filter(Boolean))
const KEY = String(process.env.STORAGE_SERVICE_KEY || '')
const MAX_BYTES = Number(process.env.STORAGE_MAX_BYTES) || 10 * 1024 * 1024
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' }

if (!KEY) {
  console.error('STORAGE_SERVICE_KEY is not set; refusing to start without an upload key.')
  process.exit(1)
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

// Same error shape as Supabase Storage, which Frontier's error messages read.
function fail(res, status, error, message) {
  json(res, status, { statusCode: String(status), error, message })
}

function authorized(req) {
  const header = String(req.headers.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(token)
  const b = Buffer.from(KEY)
  return a.length === b.length && timingSafeEqual(a, b)
}

// "<bucket>/<path>" -> absolute file path, or null if anything looks off.
function resolveObject(bucket, objectPath) {
  if (!BUCKETS.has(bucket)) return null
  const segments = objectPath.split('/')
  if (!objectPath || segments.some((s) => !s || s === '.' || s === '..' || !/^[A-Za-z0-9._ -]+$/.test(s))) return null
  const file = path.resolve(ROOT, bucket, ...segments)
  return file.startsWith(path.join(ROOT, bucket) + path.sep) ? file : null
}

// supabase-js sends a file as a form with an unnamed field, which Node's own
// form parser refuses, so find the part that carries a filename (or, failing
// that, the one that isn't the cacheControl field) by hand.
function filePart(body, type) {
  const boundary = (type.match(/boundary=(?:"([^"]+)"|([^;]+))/) || [])[1] || (type.match(/boundary=(?:"([^"]+)"|([^;]+))/) || [])[2]
  if (!boundary) return null
  const sep = Buffer.from(`--${boundary}`)
  const parts = []
  let at = body.indexOf(sep)
  while (at !== -1) {
    const next = body.indexOf(sep, at + sep.length)
    if (next === -1) break
    let part = body.subarray(at + sep.length, next)
    if (part[0] === 13 && part[1] === 10) part = part.subarray(2)
    if (part.at(-2) === 13 && part.at(-1) === 10) part = part.subarray(0, -2)
    const split = part.indexOf('\r\n\r\n')
    if (split !== -1) parts.push({ head: part.subarray(0, split).toString('utf8'), data: part.subarray(split + 4) })
    at = next
  }
  const named = parts.find((p) => /filename=/i.test(p.head))
  return (named || parts.find((p) => !/name="cacheControl"/i.test(p.head)) || {}).data || null
}

async function upload(req, res, bucket, objectPath) {
  if (!authorized(req)) return fail(res, 403, 'Unauthorized', 'Invalid service key')
  const file = resolveObject(bucket, objectPath)
  if (!file) return fail(res, 400, 'InvalidKey', `Invalid bucket or object name: ${bucket}/${objectPath}`)
  const upsert = String(req.headers['x-upsert'] || 'false').toLowerCase() === 'true'

  // Read the whole upload (it's capped), then unwrap a multipart form.
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BYTES + 64 * 1024) return fail(res, 413, 'Payload too large', `Objects are limited to ${MAX_BYTES} bytes`)
    chunks.push(chunk)
  }
  let body = Buffer.concat(chunks)
  const type = String(req.headers['content-type'] || '')
  if (type.startsWith('multipart/form-data')) {
    const file = filePart(body, type)
    if (!file) return fail(res, 400, 'InvalidRequest', 'No file in the upload')
    body = file
  }
  if (!body.length) return fail(res, 400, 'InvalidRequest', 'Empty upload')
  if (body.length > MAX_BYTES) return fail(res, 413, 'Payload too large', `Objects are limited to ${MAX_BYTES} bytes`)
  await mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${randomUUID()}.part`
  const handle = await open(tmp, 'wx', 0o644)
  try { await handle.write(body) } finally { await handle.close() }
  if (!upsert && (await stat(file).catch(() => null))) {
    await unlink(tmp).catch(() => {})
    return fail(res, 409, 'Duplicate', 'The resource already exists')
  }
  await rename(tmp, file)
  const key = `${bucket}/${objectPath}`
  return json(res, 200, { Key: key, Id: key })
}

async function download(req, res, bucket, objectPath) {
  const file = resolveObject(bucket, objectPath)
  const info = file && (await stat(file).catch(() => null))
  if (!info || !info.isFile()) return fail(res, 404, 'not_found', 'Object not found')
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
  if (req.method === 'HEAD') return res.end()
  createReadStream(file).pipe(res)
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x')
    const decoded = decodeURIComponent(pathname)
    let m = decoded.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
    if (m && ['GET', 'HEAD'].includes(req.method)) return await download(req, res, m[1], m[2])
    m = decoded.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/)
    if (m && ['POST', 'PUT'].includes(req.method)) return await upload(req, res, m[1], m[2])
    // Authenticated download, as Supabase allows with the service key.
    if (m && ['GET', 'HEAD'].includes(req.method)) {
      if (!authorized(req)) return fail(res, 403, 'Unauthorized', 'Invalid service key')
      return await download(req, res, m[1], m[2])
    }
    return fail(res, 404, 'not_found', 'Not found')
  } catch (error) {
    console.error(`${req.method} ${req.url}:`, error)
    if (!res.headersSent) fail(res, 500, 'internal', 'Storage error')
    else res.end()
  }
})

server.listen(Number(process.env.PORT) || 54393, process.env.HOST || '127.0.0.1', () => {
  console.log(`americaecon storage on ${server.address().address}:${server.address().port}, root ${ROOT}, buckets ${[...BUCKETS].join(', ')}`)
})
