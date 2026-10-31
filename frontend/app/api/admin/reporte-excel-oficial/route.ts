import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://146.181.58.160:8080/api').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(`${BACKEND_API_URL}/admin/motor-python/reporte-excel-oficial`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Reporte_Oficial_Consolidado_${dateStr}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating official Excel:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Error al generar el Excel oficial con Python' },
      { status: 500 }
    );
  }
}
