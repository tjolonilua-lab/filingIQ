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
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `intakes/${filename}`,
        Body: buffer,
        ContentType: file.type,
      })

      await s3Client.send(command)

      const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/intakes/${filename}`
      return { urlOrPath: url }
    } catch (error) {
      console.error('S3 upload failed, falling back to local storage:', error)
      // Fall through to local storage
    }
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

