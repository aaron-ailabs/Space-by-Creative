import { parseMorphEdits, applyMorphEditToFile } from '@/lib/morph-fast-apply';
import type { SandboxState } from '@/types/sandbox';

export interface ParsedResponse {
  explanation: string;
  template: string;
  files: Array<{ path: string; content: string }>;
  packages: string[];
  commands: string[];
  structure: string | null;
}

export function parseAIResponse(response: string): ParsedResponse {
  const sections = {
    files: [] as Array<{ path: string; content: string }>,
    commands: [] as string[],
    packages: [] as string[],
    structure: null as string | null,
    explanation: '',
    template: ''
  };

  const fileMap = new Map<string, { content: string; isComplete: boolean }>();
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    const hasClosingTag = response.substring(match.index, match.index + match[0].length).includes('</file>');
    const existing = fileMap.get(filePath);
    
    let shouldReplace = false;
    if (!existing) {
      shouldReplace = true;
    } else if (!existing.isComplete && hasClosingTag) {
      shouldReplace = true;
    } else if (existing.isComplete && hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true;
    } else if (!existing.isComplete && !hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true;
    }
    
    if (shouldReplace) {
      if (content.includes('...') && !content.includes('...props') && !content.includes('...rest')) {
        if (!existing) {
          fileMap.set(filePath, { content, isComplete: hasClosingTag });
        }
      } else {
        fileMap.set(filePath, { content, isComplete: hasClosingTag });
      }
    }
  }
  
  for (const [path, { content }] of fileMap.entries()) {
    sections.files.push({ path, content });
  }

  const cmdRegex = /<command>(.*?)<\/command>/g;
  while ((match = cmdRegex.exec(response)) !== null) {
    sections.commands.push(match[1].trim());
  }

  const pkgRegex = /<package>(.*?)<\/package>/g;
  while ((match = pkgRegex.exec(response)) !== null) {
    sections.packages.push(match[1].trim());
  }
  
  const packagesRegex = /<packages>([\s\S]*?)<\/packages>/;
  const packagesMatch = response.match(packagesRegex);
  if (packagesMatch) {
    const packagesContent = packagesMatch[1].trim();
    const packagesList = packagesContent.split(/[\n,]+/)
      .map(pkg => pkg.trim())
      .filter(pkg => pkg.length > 0);
    sections.packages.push(...packagesList);
  }

  const structureMatch = /<structure>([\s\S]*?)<\/structure>/;
  const structResult = response.match(structureMatch);
  if (structResult) {
    sections.structure = structResult[1].trim();
  }

  const explanationMatch = /<explanation>([\s\S]*?)<\/explanation>/;
  const explResult = response.match(explanationMatch);
  if (explResult) {
    sections.explanation = explResult[1].trim();
  }

  const templateMatch = /<template>(.*?)<\/template>/;
  const templResult = response.match(templateMatch);
  if (templResult) {
    sections.template = templResult[1].trim();
  }

  return sections;
}

export async function applyCodeToSandbox(
  sandbox: any, 
  parsed: ParsedResponse, 
  isEdit: boolean,
  morphEnabled: boolean,
  response: string
) {
  const morphEdits = morphEnabled ? parseMorphEdits(response) : [];
  const results = {
    filesCreated: [] as string[],
    filesUpdated: [] as string[],
    packagesInstalled: [] as string[],
    packagesAlreadyInstalled: [] as string[],
    packagesFailed: [] as string[],
    commandsExecuted: [] as string[],
    errors: [] as string[]
  };

  const morphUpdatedPaths = new Set<string>();
  if (morphEnabled && morphEdits.length > 0) {
    for (const edit of morphEdits) {
      try {
        const result = await applyMorphEditToFile({
          sandbox,
          targetPath: edit.targetFile,
          instructions: edit.instructions,
          updateSnippet: edit.update
        });

        if (result.success && result.normalizedPath) {
          morphUpdatedPaths.add(result.normalizedPath);
          results.filesUpdated.push(result.normalizedPath);
        } else {
          results.errors.push(`Morph apply failed for ${edit.targetFile}: ${result.error || 'Unknown error'}`);
        }
      } catch (e) {
        results.errors.push(`Morph apply exception for ${edit.targetFile}: ${(e as Error).message}`);
      }
    }
  }

  const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
  let filteredFiles = parsed.files.filter(file => {
    const fileName = file.path.split('/').pop() || '';
    return !configFiles.includes(fileName);
  });

  if (morphUpdatedPaths.size > 0) {
    filteredFiles = filteredFiles.filter(file => {
      let normalizedPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      if (!normalizedPath.startsWith('src/') && !normalizedPath.startsWith('public/') && normalizedPath !== 'index.html') {
        normalizedPath = 'src/' + normalizedPath;
      }
      return !morphUpdatedPaths.has(normalizedPath);
    });
  }

  for (const file of filteredFiles) {
    try {
      let normalizedPath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
      if (!normalizedPath.startsWith('src/') && !normalizedPath.startsWith('public/') && normalizedPath !== 'index.html' && !configFiles.includes(normalizedPath.split('/').pop() || '')) {
        normalizedPath = 'src/' + normalizedPath;
      }
      
      let fileContent = file.content;
      if (file.path.endsWith('.jsx') || file.path.endsWith('.js') || file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
        fileContent = fileContent.replace(/import\s+['"]\.\/[^'"]+\.css['"];?\s*\n?/g, '');
      }
      if (file.path.endsWith('.css')) {
        fileContent = fileContent.replace(/shadow-3xl/g, 'shadow-2xl').replace(/shadow-4xl/g, 'shadow-2xl').replace(/shadow-5xl/g, 'shadow-2xl');
      }

      if (sandbox.writeFile) {
        await sandbox.writeFile(file.path, fileContent);
      } else if (sandbox.files?.write) {
        await sandbox.files.write(`/home/user/app/${normalizedPath}`, fileContent);
      }

      results.filesCreated.push(normalizedPath);
    } catch (error) {
      results.errors.push(`Failed to create ${file.path}: ${(error as Error).message}`);
    }
  }

  return results;
}
