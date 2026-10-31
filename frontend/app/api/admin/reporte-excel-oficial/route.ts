import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const rootDir = path.resolve(process.cwd(), '..');
    const pythonExe = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
    const scriptPath = path.join(rootDir, 'generar_reporte_excel.py');

    const pythonProcess = spawn(pythonExe, [
      '-c',
      `import sys; sys.path.append(r'${rootDir}'); from motor_financiero_python import generar_suite_financiera_excel; sys.stdout.buffer.write(generar_suite_financiera_excel())`
    ], {
      cwd: rootDir,
      env: process.env,
    });

    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      pythonProcess.stdout.on('data', (data) => chunks.push(data));
      pythonProcess.stderr.on('data', (data) => errorChunks.push(data));
      pythonProcess.on('close', (code) => {
        if (code === 0) resolve();
        else {
          const errStr = Buffer.concat(errorChunks).toString('utf-8');
          reject(new Error(errStr || `Python process exited with code ${code}`));
        }
      });
    });

    const excelBuffer = Buffer.concat(chunks);
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(excelBuffer, {
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

