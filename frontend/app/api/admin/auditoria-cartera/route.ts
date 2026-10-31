import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const rootDir = path.resolve(process.cwd(), '..');
    const pythonExe = path.join(rootDir, '.venv', 'Scripts', 'python.exe');

    const pythonProcess = spawn(pythonExe, [
      '-c',
      `import sys, json; sys.path.append(r'${rootDir}'); from motor_financiero_python import auditar_cartera_completa; print(json.dumps(auditar_cartera_completa()[:100]))`
    ], {
      cwd: rootDir,
      env: process.env,
    });

    let output = '';
    let errorOutput = '';

    await new Promise<void>((resolve, reject) => {
      pythonProcess.stdout.on('data', (data) => (output += data.toString()));
      pythonProcess.stderr.on('data', (data) => (errorOutput += data.toString()));
      pythonProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(errorOutput || `Exit code ${code}`));
      });
    });

    const data = JSON.parse(output.trim() || '[]');
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Error en auditoría' },
      { status: 500 }
    );
  }
}

