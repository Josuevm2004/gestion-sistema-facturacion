import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://146.181.58.160:8080/api').replace(/\/$/, '');

const HOP_BY_HOP_HEADERS = new Set([
  'accept-encoding',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

// Headers de respuesta que no deben propagarse al cliente directamente
const RESPONSE_HEADERS_TO_REMOVE = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

async function proxyRequest(request: NextRequest, context: { params: { path?: string[] } }) {
  const path = (context.params.path || []).join('/');
  const targetUrl = new URL(`${BACKEND_API_URL}/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const response = await fetch(targetUrl, {
    method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: 'no-store',
  });

  const responseHeaders = new Headers(response.headers);
  RESPONSE_HEADERS_TO_REMOVE.forEach((header) => responseHeaders.delete(header));
  responseHeaders.set('Cache-Control', 'no-store');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
