import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface UploadResult {
  urlOrPath: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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

export async function storeUpload(
  file: File,
  filenameHint?: string
): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 10MB limit: ${file.name}`)
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: PDF, JPG, PNG`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const timestamp = Date.now()
  const sanitizedFilename = filenameHint || file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filename = `${timestamp}-${sanitizedFilename}`

  // Try S3 upload first if configured
  if (s3Client && process.env.AWS_S3_BUCKET) {
    try {
      console.log('Attempting S3 upload to bucket:', process.env.AWS_S3_BUCKET)
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `intakes/${filename}`,
        Body: buffer,
        ContentType: file.type,
      })

      await s3Client.send(command)
      console.log('S3 upload successful:', filename)

      const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/intakes/${filename}`
      return { urlOrPath: url }
    } catch (error: any) {
      console.error('S3 upload failed:', error)
      console.error('S3 error details:', {
        code: error.code,
        message: error.message,
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      })
      // Re-throw S3 errors with more context
      if (error.code === 'AccessDenied' || error.code === '403') {
        throw new Error('S3 access denied. Check IAM user permissions and bucket policy.')
      }
      if (error.code === 'NoSuchBucket' || error.code === '404') {
        throw new Error(`S3 bucket not found: ${process.env.AWS_S3_BUCKET}. Check bucket name and region.`)
      }
      if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
        throw new Error('Invalid AWS credentials. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.')
      }
      throw new Error(`S3 upload failed: ${error.message || error.code || 'Unknown error'}`)
    }
  } else {
    console.warn('S3 not configured:', {
      hasClient: !!s3Client,
      hasBucket: !!process.env.AWS_S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })
  }

  // Fallback to local storage
  // Note: On Vercel, local storage won't persist. S3 should be configured for production.
  const uploadsDir = join(process.cwd(), 'uploads')
  try {
    await mkdir(uploadsDir, { recursive: true })
  } catch (error) {
    // Directory might already exist or filesystem is read-only (Vercel)
    console.warn('Could not create uploads directory:', error)
  }

  try {
    const filePath = join(uploadsDir, filename)
    await writeFile(filePath, buffer)
    return { urlOrPath: `/uploads/${filename}` }
  } catch (error: any) {
    // If local storage fails (e.g., on Vercel), throw error to indicate S3 is required
    console.error('Local file storage failed. S3 must be configured for production:', error)
    
    // Provide a more user-friendly error message
    if (error.code === 'EPERM' || error.code === 'EROFS' || error.message?.includes('read-only')) {
      throw new Error('File upload is not configured. Please contact support or configure AWS S3 storage.')
    }
    
    throw new Error(`Failed to save file: ${error.message || 'Unknown error'}`)
  }
}

