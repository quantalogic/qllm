const { version } = require('../package.json');

const isRelease = /^\d+\.\d+\.\d+$/.test(version);

console.log(`::set-output name=is_release::${isRelease}`);

if (isRelease) {
  console.log(`Version ${version} is a release version.`);
} else {
  console.log(`Version ${version} is not a release version.`);
}