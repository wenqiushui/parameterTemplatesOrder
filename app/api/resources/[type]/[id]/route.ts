import { NextRequest } from 'next/server';
import { handleResourceRequest } from '@/lib/handlers/resourceHandler';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string, id: string } }
) {
  return handleResourceRequest(request, params.type, params.id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string, id: string } }
) {
  return handleResourceRequest(request, params.type, params.id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string, id: string } }
) {
  return handleResourceRequest(request, params.type, params.id);
}
