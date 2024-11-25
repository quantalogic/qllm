import { GithubLoaderTool } from "qllm-lib";
import { writeFile } from 'fs/promises';

async function main(): Promise<void> {
  console.log("\n🔍 Starting GitHub Repository Analysis");

  const githubLoader = new GithubLoaderTool({
    authToken: process.env.GITHUB_TOKEN  // Make sure to set this environment variable
  });

  try {
    const result = await githubLoader.execute({
      repositoryUrl: "https://github.com/YatchiYa/argon-react-native",
      excludePatterns: '.test.ts,/temp/,*.log,*/argon.json',
    });

    await writeFile('repository-content.md', result.content, 'utf-8');
    
    console.log(`\n✅ Repository content saved to repository-content.md`);
    console.log(`Processed ${result.fileCount} of ${result.totalFiles} files`);

  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});