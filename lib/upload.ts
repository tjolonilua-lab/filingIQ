import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from './constants'
import { logger } from './logger'

interface UploadResult {
  urlOrPath: string
}

// Initialize S3 client if credentials are available
const s3Client = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null

/**
 * Store an uploaded file to S3 or local filesystem
 * 
 * Validates file size and type, then uploads to S3 if configured,
 * otherwise falls back to local filesystem (development only).
 * 
 * @param file - The File object from the upload
 * @param filenameHint - Optional filename hint (defaults to file.name)
 * @returns Object containing the URL or path to the stored file
 * @throws {Error} If file size exceeds limit, invalid file type, or upload fails
 * 
 * @example
 * ```typescript
 * const result = await storeUpload(file, 'document.pdf')
 * // result.urlOrPath will be S3 URL or local path
 * ```
 */
export async function storeUpload(
  file: File,
  filenameHint?: string
): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 10MB limit: ${file.name}`)
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: PDF, JPG, PNG`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const timestamp = Date.now()
  const sanitizedFilename = filenameHint || file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filename = `${timestamp}-${sanitizedFilename}`

  // Try S3 upload first if configured
  if (s3Client && process.env.AWS_S3_BUCKET) {
    try {
      logger.debug('Attempting S3 upload', { bucket: process.env.AWS_S3_BUCKET, filename })
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `intakes/${filename}`,
        Body: buffer,
        ContentType: file.type,
      })

      await s3Client.send(command)
      logger.info('S3 upload successful', { filename, bucket: process.env.AWS_S3_BUCKET })

      // Generate S3 URL - us-east-1 uses different format (no region in URL)
      const region = process.env.AWS_REGION || 'us-east-1'
      const bucket = process.env.AWS_S3_BUCKET
      const key = `intakes/${filename}`
      
      let url: string
      if (region === 'us-east-1') {
        // us-east-1 uses bucket.s3.amazonaws.com format
        url = `https://${bucket}.s3.amazonaws.com/${key}`
      } else {
        // Other regions use bucket.s3.region.amazonaws.com format
        url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
      }
      
      return { urlOrPath: url }
    } catch (error: unknown) {
      const errorObj = error as { code?: string; message?: string }
      logger.error('S3 upload failed', error as Error, {
        code: errorObj.code,
        message: errorObj.message,
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      })
      // Re-throw S3 errors with more context
      if (errorObj.code === 'AccessDenied' || errorObj.code === '403') {
        throw new Error('S3 access denied. Check IAM user permissions and bucket policy.')
      }
      if (errorObj.code === 'NoSuchBucket' || errorObj.code === '404') {
        throw new Error(`S3 bucket not found: ${process.env.AWS_S3_BUCKET}. Check bucket name and region.`)
      }
      if (errorObj.code === 'InvalidAccessKeyId' || errorObj.code === 'SignatureDoesNotMatch') {
        throw new Error('Invalid AWS credentials. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.')
      }
      throw new Error(`S3 upload failed: ${errorObj.message || errorObj.code || 'Unknown error'}`)
    }
  } else {
    logger.warn('S3 not configured, falling back to local storage', {
      hasClient: !!s3Client,
      hasBucket: !!process.env.AWS_S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })
  }

  // Don't fall back to local storage on Vercel (filesystem is read-only)
  // If we get here, S3 is not configured or failed
  if (!s3Client || !process.env.AWS_S3_BUCKET) {
    const missing = []
    if (!process.env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID')
    if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY')
    if (!process.env.AWS_S3_BUCKET) missing.push('AWS_S3_BUCKET')
    if (!process.env.AWS_REGION) missing.push('AWS_REGION')
    
    throw new Error(
      `AWS S3 is not configured. Missing environment variables: ${missing.join(', ')}. ` +
      `Please add these to your Vercel project settings.`
    )
  }
  
  // If S3 client exists but upload failed, we already threw an error above
  // This should never be reached, but just in case:
  throw new Error('File upload failed. S3 configuration may be incorrect. Check Vercel function logs for details.')
}

/**
 * Download file content from S3 using the same credentials as upload.
 * Use this instead of fetch() when the bucket is private (avoids 403 Forbidden).
 */
export async function getS3ObjectBuffer(s3Url: string): Promise<{ buffer: Buffer; contentType?: string }> {
  if (!s3Client) {
    throw new Error('S3 not configured. Cannot download file for analysis.')
  }
  const url = new URL(s3Url)
  const hostnameParts = url.hostname.split('.')
  const bucket = hostnameParts[0]
  const key = url.pathname.substring(1)
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const result = await s3Client.send(command)
  const body = result.Body
  if (!body) {
    throw new Error('S3 object has no body')
  }
  const bytes = await body.transformToByteArray()
  const buffer = Buffer.from(bytes)
  const contentType = result.ContentType ?? undefined
  return { buffer, contentType }
}

