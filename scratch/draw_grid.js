import sharp from 'sharp';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const destPath = 'scratch/raccoon_grid_debug.png';

  const metadata = await sharp(imgPath).metadata();
  const w = metadata.width;
  const h = metadata.height;

  // Let's create an SVG overlay with grid lines
  let svg = `<svg width="${w}" height="${h}">`;

  // Draw row lines
  const rowH = h / 3;
  svg += `<line x1="0" y1="${rowH}" x2="${w}" y2="${rowH}" stroke="red" stroke-width="2"/>`;
  svg += `<line x1="0" y1="${rowH * 2}" x2="${w}" y2="${rowH * 2}" stroke="red" stroke-width="2"/>`;

  // Draw Row 0 column lines (yellow)
  const r0W = w / 4;
  for (let i = 1; i < 4; i++) {
    svg += `<line x1="${i * r0W}" y1="0" x2="${i * r0W}" y2="${rowH}" stroke="yellow" stroke-width="2"/>`;
  }

  // Draw Row 1 column lines (green)
  const r1W = w / 6;
  for (let i = 1; i < 6; i++) {
    svg += `<line x1="${i * r1W}" y1="${rowH}" x2="${i * r1W}" y2="${rowH * 2}" stroke="green" stroke-width="2"/>`;
  }

  // Draw Row 2 column lines (blue)
  const r2W = w / 4;
  for (let i = 1; i < 4; i++) {
    svg += `<line x1="${i * r2W}" y1="${rowH * 2}" x2="${i * r2W}" y2="${h}" stroke="blue" stroke-width="2"/>`;
  }

  svg += `</svg>`;

  await sharp(imgPath)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toFile(destPath);

  console.log(`Saved grid debug image to ${destPath}`);
}

run().catch(console.error);
