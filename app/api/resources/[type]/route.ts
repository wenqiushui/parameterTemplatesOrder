import { NextRequest } from 'next/server';
import { handleResourceRequest } from '@/lib/handlers/resourceHandler';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  return handleResourceRequest(request, params.type);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  return handleResourceRequest(request, params.type);
}
