import { NextResponse } from 'next/server';
import { SandboxError, AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

declare global {
  var activeSandbox: any;
}

export async function POST() {
  try {
    if (!global.activeSandbox) {
      throw new AppError('No active sandbox available', 400, 'NO_ACTIVE_SANDBOX');
    }
    
    logger.info('Creating project zip archive');
    
    // Create zip file in sandbox using standard commands
    const zipResult = await global.activeSandbox.runCommand({
      cmd: 'bash',
      args: ['-c', `zip -r /tmp/project.zip . -x "node_modules/*" ".git/*" ".next/*" "dist/*" "build/*" "*.log"`]
    });
    
    if (zipResult.exitCode !== 0) {
      const error = await zipResult.stderr();
      logger.error('Failed to create zip in sandbox', new Error(error));
      throw new SandboxError(`Failed to create zip: ${error}`);
    }
    
    const sizeResult = await global.activeSandbox.runCommand({
      cmd: 'bash',
      args: ['-c', `ls -la /tmp/project.zip | awk '{print $5}'`]
    });
    
    const fileSize = await sizeResult.stdout();
    logger.info('Created project zip successfully', { size: fileSize.trim() });
    
    // Read the zip file and convert to base64
    const readResult = await global.activeSandbox.runCommand({
      cmd: 'base64',
      args: ['/tmp/project.zip']
    });
    
    if (readResult.exitCode !== 0) {
      const error = await readResult.stderr();
      logger.error('Failed to read zip file as base64', new Error(error));
      throw new SandboxError(`Failed to read zip file: ${error}`);
    }
    
    const base64Content = (await readResult.stdout()).trim();
    
    // Create a data URL for download
    const dataUrl = `data:application/zip;base64,${base64Content}`;
    
    return NextResponse.json({
      success: true,
      dataUrl,
      fileName: 'vercel-sandbox-project.zip',
      message: 'Zip file created successfully'
    });
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }

    logger.error('Unexpected error in create-zip', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message, code: 'INTERNAL_ERROR' }, 
      { status: 500 }
    );
  }
}