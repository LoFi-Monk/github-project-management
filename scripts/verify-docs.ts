import fs from 'node:fs';
import path from 'node:path';
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
});

const TARGET_DIRECTORIES = ['packages/core/src', 'apps/server/src'];

let hasErrors = false;

function checkFile(filePath: string) {
  const sourceFile = project.addSourceFileAtPath(filePath);
  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [name, declarations] of exportedDeclarations) {
    for (const decl of declarations) {
      if (
        Node.isFunctionDeclaration(decl) ||
        Node.isClassDeclaration(decl) ||
        Node.isInterfaceDeclaration(decl) ||
        Node.isTypeAliasDeclaration(decl) ||
        Node.isVariableDeclaration(decl)
      ) {
        // Skip overloads implementation (only check signatures)
        if (
          Node.isFunctionDeclaration(decl) &&
          !decl.isOverload() &&
          decl.getOverloads().length > 0
        ) {
          continue;
        }

        // biome-ignore lint/suspicious/noExplicitAny: ts-morph types are complex
        let jsDocs: any[] = [];

        if (Node.isTypeAliasDeclaration(decl)) {
          // biome-ignore lint/suspicious/noExplicitAny: accessing internal property
          jsDocs = (decl as any).getJsDocs?.() || [];

          // If type alias has no docs, check if there is a variable with same name that has docs (merged declaration)
          if (jsDocs.length === 0) {
            const siblings = decl.getSourceFile().getExportedDeclarations().get(name);
            if (siblings) {
              for (const sibling of siblings) {
                if (Node.isVariableDeclaration(sibling) && sibling !== decl) {
                  const varDocs = sibling.getVariableStatement()?.getJsDocs() || [];
                  if (varDocs.length > 0) {
                    // Consider it documented if the implementation is documented
                    jsDocs = varDocs;
                    break;
                  }
                  // Checks for direct leading comments on variable
                  const ranges = sibling.getLeadingCommentRanges();
                  if (ranges.some((r) => r.getText().startsWith('/**'))) {
                    jsDocs = ['found'];
                    break;
                  }
                }
              }
            }
          }
        } else if (Node.isVariableDeclaration(decl)) {
          // biome-ignore lint/suspicious/noExplicitAny: accessing internal property
          jsDocs = (decl as any).getJsDocs?.() || [];

          // Fallback: Check VariableStatement (grandparent)
          if (jsDocs.length === 0) {
            const statement = decl.getVariableStatement();
            if (statement) {
              jsDocs = statement.getJsDocs();
            }
          }
        } else {
          // biome-ignore lint/suspicious/noExplicitAny: accessing internal property
          jsDocs = (decl as any).getJsDocs?.() || [];
        }

        if (jsDocs.length === 0) {
          // One last check: leading comments that look like TSDocs
          const ranges = decl.getLeadingCommentRanges();
          const hasManualTsDoc = ranges.some((r) => r.getText().startsWith('/**'));

          if (!hasManualTsDoc) {
            console.error(
              `[MISSING TSDOC] ${filePath}:${decl.getStartLineNumber()} - Exported member '${name}' is missing documentation.`,
            );
            hasErrors = true;
          }
        }
      }
    }
  }
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'dist' && file !== 'node_modules') {
        walkDir(fullPath);
      }
    } else if (
      fullPath.endsWith('.ts') &&
      !fullPath.endsWith('.test.ts') &&
      !fullPath.endsWith('.spec.ts') &&
      !fullPath.endsWith('.d.ts')
    ) {
      console.log(`Checking: ${fullPath}`);
      checkFile(fullPath);
    }
  }
}

console.log('Starting TSDoc check...');

for (const dir of TARGET_DIRECTORIES) {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  } else {
    console.error(`Error: Target directory missing: ${dir}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\nCheck failed. Please add TSDoc comments to the exported members listed above.');
  process.exit(1);
} else {
  console.log('\nAll exported members are documented. Good job!');
  process.exit(0);
}
