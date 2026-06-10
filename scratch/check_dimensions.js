import sharp from 'sharp';
import path from 'path';

const USER_FILES_DIR = 'c:/Users/Motar/Desktop/Masters of the Wild/public/assets/characters/minotaur/';

const userFiles = [
  'Transform_the_character_into_a_2266071037-Photoroom-export.png',
  'Transform_the_character_into_a_266071037-Photoroom-export.png',
  'Transform_the_character_into_an_202606071037-Photoroom-export.png',
  'Transform_the_character_into_an_22606071037-Photoroom-export.png',
  'Transform_the_character_into_an_2266071037-Photoroom-export.png',
  'Transform_the_character_intoa_266071037-Photoroom-export.png',
  'Transform_the_character_intoa_66071037-Photoroom-export.png'
];

async function main() {
  for (const filename of userFiles) {
    const fullPath = path.join(USER_FILES_DIR, filename);
    const metadata = await sharp(fullPath).metadata();
    console.log(`- ${filename}: ${metadata.width}x${metadata.height}`);
  }
}

main();
