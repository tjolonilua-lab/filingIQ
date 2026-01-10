import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
          const url = new URL(path)
          const bucket = url.hostname.split('.')[0]
          const key = url.pathname.substring(1)

          const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })

          const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
          return NextResponse.redirect(signedUrl)
        } catch (error) {
          console.error('S3 error:', error)
          // Fall through to direct redirect
        }
      }
      
      // For other HTTP URLs, redirect directly
      return NextResponse.redirect(path)
    }

    // Handle local files
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
    } catch (error) {
      console.error('File read error:', error)
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

