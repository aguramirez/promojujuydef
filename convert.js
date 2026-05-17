const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('public/logo.svg', 'utf8').replace(/fill="#E63333"/g, 'fill="white"');

sharp(Buffer.from(svg))
  .resize(311, 269)
  .png()
  .toFile('public/logo-white.png')
  .then(() => {
    console.log('logo-white.png created successfully');
    
    // Also create a normal version just in case
    sharp('public/logo.svg')
      .resize(311, 269)
      .png()
      .toFile('public/logo.png')
      .then(() => console.log('logo.png created successfully'));
  })
  .catch(console.error);
