import { LocalProjectLoaderTool } from "qllm-lib";
import { writeFile } from 'fs/promises';

async function main(): Promise<void> {
  console.log("\n🔍 Starting Local Project Analysis");

  const localLoader = new LocalProjectLoaderTool({
    excludeFolders: ['node_modules', '.git', 'dist', 'coverage'],
    excludeExtensions: ['.log', '.lock']
  });

  try {
    const result = await localLoader.execute({
      projectPath: '/path/to/your/project',
      // Optional: additional excludes
      excludeFolders: ['temp', 'cache'],
      excludeExtensions: ['.env']
    });

    await writeFile('project-content.md', result.content, 'utf-8');
    
    console.log(`\n✅ Project content saved to project-content.md`);
    console.log(`Processed ${result.fileCount} of ${result.totalFiles} files`);
    console.log('Excluded folders:', result.excludedFolders);
    console.log('Excluded extensions:', result.excludedExtensions);

  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});