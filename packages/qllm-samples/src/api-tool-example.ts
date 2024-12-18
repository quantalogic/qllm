import { ApiServerCallTool } from 'qllm-lib';

async function testApiTool() {
    const apiTool = new ApiServerCallTool();

    try {
        // Example 1: GET request
        console.log('Testing GET request...');
        const getPosts = await apiTool.execute({
            url: 'https://jsonplaceholder.typicode.com/posts/1',
            method: 'GET'
        });
        console.log('GET Result:', getPosts);

        // Example 2: POST request
        console.log('\nTesting POST request...');
        const createPost = await apiTool.execute({
            url: 'https://jsonplaceholder.typicode.com/posts',
            method: 'POST',
            data: {
                title: 'Test Post',
                body: 'This is a test post',
                userId: 1
            }
        });
        console.log('POST Result:', createPost);

        // Example 3: GET request with query parameters
        console.log('\nTesting GET request with query parameters...');
        const getComments = await apiTool.execute({
            url: 'https://jsonplaceholder.typicode.com/comments?postId=1',
            method: 'GET'
        });
        console.log('GET Comments Result:', getComments.slice(0, 2)); // Show only first 2 comments

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the test
testApiTool().catch(console.error);
