import sharp from 'sharp';

async function run() {
  const imgPath = 'public/assets/characters/raccoon/raccoon_poses.png';
  const { data, info } = await sharp(imgPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const rowHeight = 670;
  const cuts = [
    [0, 746, 1248, 1709, 2400], // Row 0 cuts
    [0, 748, 1281, 1744, 2400]  // Row 1 cuts
  ];

  // Target frame size in the new spritesheet
  const targetW = 800;
  const targetH = 700;
  
  // Create a blank transparent canvas for the new spritesheet
  const newWidth = targetW * 4;
  const newHeight = targetH * 2;
  const newBuffer = Buffer.alloc(newWidth * newHeight * 4, 0); // All transparent

  for (let r = 0; r < 2; r++) {
    const rowCuts = cuts[r];
    for (let c = 0; c < 4; c++) {
      const leftBound = rowCuts[c];
      const rightBound = rowCuts[c+1];
      const topBound = r * rowHeight;
      const bottomBound = (r + 1) * rowHeight;

      // Find tight bounding box of the character inside this cell
      let minX = rightBound;
      let maxX = leftBound;
      let minY = bottomBound;
      let maxY = topBound;
      let hasPixels = false;

      for (let y = topBound; y < bottomBound; y++) {
        for (let x = leftBound; x < rightBound; x++) {
          const idx = (y * width + x) * channels;
          const rVal = data[idx];
          const gVal = data[idx + 1];
          const bVal = data[idx + 2];
          const aVal = channels === 4 ? data[idx + 3] : 255;

          const isBg = rVal < 35 && gVal < 35 && bVal < 35;
          if (!isBg && aVal > 15) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            hasPixels = true;
          }
        }
      }

      if (!hasPixels) {
        console.log(`Cell row ${r} col ${c} has no pixels!`);
        continue;
      }

      console.log(`Cell [${r}, ${c}]: bounding box left=${minX}, right=${maxX}, top=${minY}, bottom=${maxY} (width=${maxX - minX}, height=${maxY - minY})`);

      // Width and height of character content
      const charW = maxX - minX + 1;
      const charH = maxY - minY + 1;

      // Center character horizontally in the target 800px frame
      const destLeft = c * targetW + Math.floor((targetW - charW) / 2);
      // Place the bottom of the character's bounding box at 95% of target height (665px)
      const destBottom = r * targetH + Math.floor(targetH * 0.95);
      const destTop = destBottom - charH;

      // Copy pixels to the new buffer
      for (let cy = 0; cy < charH; cy++) {
        const srcY = minY + cy;
        const outY = destTop + cy;
        if (outY < 0 || outY >= newHeight) continue;

        for (let cx = 0; cx < charW; cx++) {
          const srcX = minX + cx;
          const outX = destLeft + cx;
          if (outX < 0 || outX >= newWidth) continue;

          const srcIdx = (srcY * width + srcX) * channels;
          const outIdx = (outY * newWidth + outX) * 4;

          newBuffer[outIdx] = data[srcIdx];
          newBuffer[outIdx + 1] = data[srcIdx + 1];
          newBuffer[outIdx + 2] = data[srcIdx + 2];
          newBuffer[outIdx + 3] = channels === 4 ? data[srcIdx + 3] : 255;
        }
      }
    }
  }

  // Save the new aligned image
  const destPath = 'public/assets/characters/raccoon/raccoon_poses_aligned.png';
  await sharp(newBuffer, {
    raw: {
      width: newWidth,
      height: newHeight,
      channels: 4
    }
  })
  .png()
  .toFile(destPath);

  console.log(`Successfully generated aligned spritesheet: ${destPath}`);
}

run().catch(console.error);
