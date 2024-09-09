const fs = require('fs');

const inputValue = process.env.INPUT_VALUE || 'Default Value';
console.log(`Received input: ${inputValue}`);

const output = `Processed: ${inputValue.toUpperCase()}`;
fs.writeFileSync('/app/output/output.txt', output);

console.log('Processing complete');