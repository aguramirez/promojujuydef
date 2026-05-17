const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('public/logo.svg', 'utf8').replace(/fill="#E63333"/g, 'fill="white"');

sharp(Buffer.from(svg))
  .resize(311, 269)
  .flatten({ background: { r: 196, g: 30, b: 40 } })
  .png()
  .toFile('public/logo-pdf.png')
  .then(() => console.log('logo-pdf.png created successfully'))
  .catch(console.error);
