const fs = require('fs');

// Let's check how many clients are in dev.db or mock or if we can see them from backend or sqlite
// Let's check if there's any file with clients in the repository
console.log('Searching for clients files...');
const files = fs.readdirSync('.');
console.log('Root files:', files);
