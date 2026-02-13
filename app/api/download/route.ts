import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { logger } from '@/lib/logger'
import { validationError, serverError, notFoundError } from '@/lib/api'

const s3Client = process.env.AWS_ACCESS_KEY_ID
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path')
    const filename = request.nextUrl.searchParams.get('filename') || 'document'

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path required' },
        { status: 400 }
      )
    }

    // Handle S3 URLs
    if (path.startsWith('http')) {
      // For S3 URLs, redirect to a signed URL or return the URL
      if (s3Client && (path.includes('s3') || path.includes('amazonaws.com'))) {
        try {
          // Extract bucket and key from URL
          // Handles both formats:
          // - bucket.s3.amazonaws.com/key (us-east-1)
          // - bucket.s3.region.amazonaws.com/key (other regions)
          const url = new URL(path)
          const hostnameParts = url.hostname.split('.')
          
          // Bucket is always the first part
          const bucket = hostnameParts[0]
          
          // Key is the pathname without leading slash
          const key = url.pathname.substring(1)

          const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })

          const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
          return NextResponse.redirect(signedUrl)
        } catch (error) {
          logger.error('S3 signed URL generation error', error as Error, { path })
          // Fall through to direct redirect (may fail if bucket is private)
        }
      }
      
      // For other HTTP URLs, redirect directly
      return NextResponse.redirect(path)
    }

    // Handle local files (fallback for development only)
    // On Vercel, files should be in S3, so this will rarely work
    const filePath = join(process.cwd(), path.replace(/^\/uploads\//, 'uploads/'))
    
    try {
      const fileBuffer = await readFile(filePath)
      
      // Determine content type
      const ext = filename.split('.').pop()?.toLowerCase()
      const contentTypeMap: Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
      }
      const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (error: any) {
      // If file doesn't exist locally, it's likely in S3
      // Return a helpful error message
      if (error.code === 'ENOENT') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'File not found locally. If this is an S3 file, ensure the URL is correct.',
            hint: 'Files should be accessed via their S3 URLs directly, not through this endpoint.'
          },
          { status: 404 }
        )
      }
      logger.error('File read error', error as Error, { path })
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    logger.error('Download error', error as Error, { path, filename })
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

