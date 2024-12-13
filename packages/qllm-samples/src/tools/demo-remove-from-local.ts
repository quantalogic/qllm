import { RemoveFromLocalTool } from "qllm-lib/src/tools/remove_from_local.tool";
import { FileSaverTool } from "qllm-lib/src/tools/file-saver.tool";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";

async function testRemoveFromLocal() {
    const remover = new RemoveFromLocalTool();
    const saver = new FileSaverTool(); // For creating test files
    const testDir = path.join(process.cwd(), 'test-files');
    const results = [];

    // Ensure test directory exists
    if (!existsSync(testDir)) {
        await mkdir(testDir);
    }

    // Test 1: Remove a single file
    const testFile1 = path.join(testDir, 'file-to-remove.txt');
    try {
        // Create a test file first
        await saver.execute({
            path: testFile1,
            content: 'This file will be removed'
        });

        // Test file removal
        const result1 = await remover.execute({
            path: testFile1
        });
        results.push({
            test: 'Remove single file',
            ...result1,
            success: !existsSync(testFile1)
        });
    } catch (error) {
        results.push({
            test: 'Remove single file',
            error: error instanceof Error ? error.message : String(error)
        });
    }

    // Test 2: Remove a directory with contents
    const testDir2 = path.join(testDir, 'dir-to-remove');
    const testFile2 = path.join(testDir2, 'nested-file.txt');
    try {
        // Create test directory and file
        if (!existsSync(testDir2)) {
            await mkdir(testDir2);
        }
        await saver.execute({
            path: testFile2,
            content: 'This is a nested file'
        });

        // Test directory removal
        const result2 = await remover.execute({
            path: testDir2,
            recursive: true
        });
        results.push({
            test: 'Remove directory with contents',
            ...result2,
            success: !existsSync(testDir2)
        });
    } catch (error) {
        results.push({
            test: 'Remove directory with contents',
            error: error instanceof Error ? error.message : String(error)
        });
    }

    // Test 3: Try to remove non-existent file with force option
    const nonExistentFile = path.join(testDir, 'non-existent.txt');
    try {
        const result3 = await remover.execute({
            path: nonExistentFile,
            force: true
        });
        results.push({
            test: 'Remove non-existent file (force)',
            ...result3,
            success: result3.removed === false
        });
    } catch (error) {
        results.push({
            test: 'Remove non-existent file (force)',
            error: error instanceof Error ? error.message : String(error)
        });
    }

    // Test 4: Try to remove directory without recursive flag (should fail)
    const testDir4 = path.join(testDir, 'dir-without-recursive');
    try {
        // Create test directory
        if (!existsSync(testDir4)) {
            await mkdir(testDir4);
        }
        await saver.execute({
            path: path.join(testDir4, 'file.txt'),
            content: 'This should prevent non-recursive removal'
        });

        await remover.execute({
            path: testDir4,
            recursive: false
        });
        results.push({
            test: 'Remove directory without recursive',
            path: testDir4,
            removed: false,
            success: false,
            message: 'Should have thrown an error'
        });
    } catch (error) {
        results.push({
            test: 'Remove directory without recursive',
            success: true,
            error: error instanceof Error ? error.message : String(error)
        });

        // Cleanup: Remove the directory with recursive flag
        try {
            await remover.execute({
                path: testDir4,
                recursive: true,
                force: true
            });
        } catch (cleanupError) {
            console.error('Cleanup failed:', cleanupError);
        }
    }

    return results;
}

// Run tests
console.log('Starting RemoveFromLocal tests...');
testRemoveFromLocal()
    .then(results => {
        console.log('\nTest Results:');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(error => {
        console.error('Test execution failed:', error);
    });