const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/logo.svg');

  // We want to add padding. 
  // Let's create a 512x512 image, with a white background, and the logo scaled to 320x320 in the center.
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(320, 320, { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile('public/icon-512x512.png');

  // 192x192
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(120, 120, { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile('public/icon-192x192.png');

  // Apple touch icon (180x180)
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(110, 110, { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile('public/apple-touch-icon.png');

  console.log('PWA icons created successfully');
}

generateIcons().catch(console.error);
