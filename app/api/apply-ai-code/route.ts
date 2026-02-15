import { NextRequest, NextResponse } from 'next/server';
import { parseAIResponse, applyCodeToSandbox } from '@/lib/spaceApplyService';
import type { SandboxState } from '@/types/sandbox';
import type { ConversationState } from '@/types/conversation';

declare global {
  var conversationState: ConversationState | null;
  var activeSandbox: any;
  var activeSandboxProvider: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
}

export async function POST(request: NextRequest) {
  try {
    const { response, isEdit = false, packages = [] } = await request.json();
    
    if (!response) {
      return NextResponse.json({ error: 'response is required' }, { status: 400 });
    }
    
    const parsed = parseAIResponse(response);
    const morphEnabled = Boolean(isEdit && process.env.MORPH_API_KEY);
    
    if (!global.existingFiles) global.existingFiles = new Set<string>();
    const sandbox = global.activeSandbox || global.activeSandboxProvider;
    
    if (!sandbox) {
      return NextResponse.json({
        success: true,
        results: {
          filesCreated: parsed.files.map(f => f.path),
          packagesInstalled: parsed.packages,
          commandsExecuted: parsed.commands,
          errors: []
        },
        explanation: parsed.explanation,
        structure: parsed.structure,
        parsedFiles: parsed.files,
        message: `Parsed ${parsed.files.length} files successfully. Create a sandbox to apply them.`
      });
    }

    const results = await applyCodeToSandbox(sandbox, parsed, isEdit, morphEnabled, response);
    
    return NextResponse.json({
      success: true,
      results,
      explanation: parsed.explanation,
      structure: parsed.structure,
      message: `Applied ${results.filesCreated.length} files successfully`
    });
    
  } catch (error) {
    console.error('Apply AI code error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse AI code' },
      { status: 500 }
    );
  }
}