import { NextResponse } from 'next/server'
import { getBusinessConfig } from '@/lib/business-config'

export async function GET() {
  const config = getBusinessConfig()
  return NextResponse.json(config)
}

