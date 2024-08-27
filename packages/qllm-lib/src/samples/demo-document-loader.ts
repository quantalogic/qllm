import { DocumentLoader, DocumentLoaderOptions, LoadResult } from '../utils/document/document-loader';

const testDocumentLoader = async () => {
  const testUrl =
    'https://arxiv.org/search/cs?query=artificial+intelligence&searchtype=all&abstracts=show&order=-announced_date_first&size=50';

  const testFullPath =
    '/Users/raphaelmansuy/Github/03-working/qllm/packages/qllm-lib/src/samples/prompts/chain_of_tought_leader.yaml';

  // Common options
  const options: DocumentLoaderOptions = {
    useCache: true,
    maxRetries: 3,
  };

  // Loading a local file using regular path
  console.log('\nLoading local file:');
  const pathLoader = new DocumentLoader(testFullPath, options);
  pathLoader.on('progress', (progress) => {
    console.log(`File loading progress: ${(progress * 100).toFixed(2)}%`);
  });
  pathLoader.on('loaded', (result: LoadResult<Buffer>) => {
    console.log('File loaded successfully. Content length:', result.content.length);
    console.log('File MIME type:', result.mimeType);
  });
  const pathResult = await pathLoader.loadAsString();
  console.log('Path content preview:', pathResult.content.slice(0, 100));
  console.log('Path content MIME type:', pathResult.mimeType);

  // Loading from a web URL
  console.log('\nLoading from URL:');
  const urlLoader = new DocumentLoader(testUrl, { ...options, decompress: true });
  urlLoader.on('progress', (progress) => {
    console.log(`URL loading progress: ${(progress * 100).toFixed(2)}%`);
  });
  urlLoader.on('retry', (attempt, maxRetries) => {
    console.log(`Retrying URL load. Attempt ${attempt} of ${maxRetries}`);
  });
  urlLoader.on('loaded', (result: LoadResult<Buffer>) => {
    console.log('URL content loaded successfully. Content length:', result.content.length);
    console.log('URL content MIME type:', result.mimeType);
  });
  const urlResult = await urlLoader.loadAsString();
  console.log('URL content preview:', urlResult.content.slice(0, 100));
  console.log('URL content MIME type:', urlResult.mimeType);

  // Using quickLoadString with file:// syntax
  console.log('\nQuick loading file with file:// syntax:');
  const quickFileResult = await DocumentLoader.quickLoadString(`file://${testFullPath}`, options);
  console.log('Quick file content type:', typeof quickFileResult.content);
  console.log('Quick file content length:', quickFileResult.content.length);
  console.log('Quick file MIME type:', quickFileResult.mimeType);

  // Using quickLoadBuffer with file:// syntax
  console.log('\nQuick loading file as buffer with file:// syntax:');
  const quickBufferResult = await DocumentLoader.quickLoadBuffer(`file://${testFullPath}`, options);
  console.log('Quick buffer content type:', quickBufferResult.content instanceof Buffer);
  console.log('Quick buffer content length:', quickBufferResult.content.length);
  console.log('Quick buffer MIME type:', quickBufferResult.mimeType);

  // Loading multiple documents
  console.log('\nLoading multiple documents:');
  const inputs = [testFullPath, testUrl, `file://${testFullPath}`];
  const multipleResults = await DocumentLoader.loadMultipleAsString(inputs, options);
  multipleResults.forEach((result, index) => {
    console.log(`Document ${index + 1} loaded. Content length:`, result.content.length);
    console.log(`Document ${index + 1} MIME type:`, result.mimeType);
  });

  // Demonstrating cancellation
  console.log('\nDemonstrating cancellation:');
  const cancelLoader = new DocumentLoader(testUrl, options);
  cancelLoader.on('progress', (progress) => {
    console.log(`Cancel demo progress: ${(progress * 100).toFixed(2)}%`);
    if (progress > 0.5) {
      console.log('Cancelling at 50% progress');
      cancelLoader.cancel();
    }
  });
  try {
    await cancelLoader.loadAsString();
  } catch (error) {
    console.log('Caught cancel error:', error);
  }
};

testDocumentLoader()
  .then(() => {
    console.log('All tests completed successfully');
  })
  .catch((error) => {
    console.error('Error in test suite:', error);
  });