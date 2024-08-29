import main from './qllm';

main().then(() => {
    }).catch((error) => {
    console.error('An error occurred:', error);
    process.exit(1);
});