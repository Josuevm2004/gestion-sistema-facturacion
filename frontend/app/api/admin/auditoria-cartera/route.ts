import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://146.181.58.160:8080/api').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(`${BACKEND_API_URL}/admin/motor-python/auditoria-cartera`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, count: 0, data: [], message: error?.message || 'Error en auditoría' },
      { status: 500 }
    );
  }
}
