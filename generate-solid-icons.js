const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const svgBuffer = fs.readFileSync('public/logo.svg');

  // Let's create a 512x512 solid white image, and overlay the red logo in the center.
  // We flatten it onto a white background so there is absolutely zero transparency (which might display as black in some viewers/devices).
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 3, // 3 channels (RGB) - no alpha/transparency channel!
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(320, 320, { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .jpeg({ quality: 100 }) // output a high quality solid JPEG first
    .toBuffer()
    .then(data => sharp(data).png().toFile('public/icon-512x512.png')); // convert that solid image to PNG

  // 192x192
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(120, 120, { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .jpeg({ quality: 100 })
    .toBuffer()
    .then(data => sharp(data).png().toFile('public/icon-192x192.png'));

  // Apple touch icon (180x180)
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(110, 110, { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .jpeg({ quality: 100 })
    .toBuffer()
    .then(data => sharp(data).png().toFile('public/apple-touch-icon.png'));

  console.log('Solid white PWA icons created successfully');
}

generateIcons().catch(console.error);
