import { NextRequest, NextResponse } from 'next/server'
import { analyzeDocuments } from '@/lib/ai-analysis'
import { storeUpload } from '@/lib/upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      )
    }

    // Upload files first
    const uploadedDocuments = []
    for (const file of files) {
      try {
        const result = await storeUpload(file, file.name)
        uploadedDocuments.push({
          filename: file.name,
          urlOrPath: result.urlOrPath,
          size: file.size,
          type: file.type,
        })
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error)
        return NextResponse.json(
          { success: false, message: `Failed to upload file: ${file.name}` },
          { status: 500 }
        )
      }
    }

    // Analyze documents
    const results = await analyzeDocuments(uploadedDocuments)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    )
  }
}

