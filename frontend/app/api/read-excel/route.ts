import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const rootDir = path.resolve('../');
    const frontendDir = path.resolve('./');

    const filesToRemove = [
      path.join(rootDir, 'promt.md'),
      path.join(rootDir, 'codigoejemplo.md'),
    ];

    const dirsToRemove = [
      path.join(frontendDir, 'admin'),
      path.join(frontendDir, 'css'),
      path.join(frontendDir, 'js'),
      path.join(frontendDir, 'lib'),
    ];

    const deletedItems: string[] = [];

    for (const f of filesToRemove) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
          deletedItems.push(f);
        } catch (e: any) {
          console.error(`Error removing file ${f}:`, e.message);
        }
      }
    }

    for (const d of dirsToRemove) {
      if (fs.existsSync(d)) {
        try {
          fs.rmSync(d, { recursive: true, force: true });
          deletedItems.push(d);
        } catch (e: any) {
          console.error(`Error removing dir ${d}:`, e.message);
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Limpieza de archivos y carpetas obsoletas completada.',
      deletedItems,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
