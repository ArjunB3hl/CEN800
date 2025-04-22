import { execFile } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {Storage} from '@google-cloud/storage';


const storage = new Storage({
    keyFilename: path.join(__dirname, ".." ,'cen800-39e49721ec16.json'), // path to your downloaded JSON key
  });
  
const bucketName = 'cen800'; // replace with your bucket name
// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const audioDir = path.join(__dirname, '..', 'audio');
const imageDir = path.join(__dirname, '..', 'images');
const videoDir = path.join(__dirname, '..','video');

// Ensure video directory exists
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
}

async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath
    ];
    execFile(ffprobeStatic.path, args, (error, stdout) => {
      if (error) return reject(error);
      const duration = parseFloat(stdout.trim());
      if (isNaN(duration)) return reject(new Error('Failed to parse duration'));
      resolve(duration);
    });
  });
}

async function processAll() {
  const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
  const imageFiles = fs.readdirSync(imageDir).filter(f => /\.(jpeg|jpg|png)$/i.test(f));

  // Regex to extract base and page from audio: (Lecture 5 (SSL)1 (1)_part_1.pdf)_1.mp3
  const audioRegex = /^(.*\.pdf)_(\d+)\.mp3$/;

  for (const audioFile of audioFiles) {
    const match = audioFile.match(audioRegex);
    if (!match) continue;
    const [_, basePdf, pageNum] = match;
    // Image pattern: images/Lecture 5 (SSL)1 (1)_part_1.pdf.1.jpeg
    // So look for: basePdf + '.' + pageNum + .jpeg
    const imagePattern = new RegExp('^' + basePdf.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\.' + pageNum + '\\.(jpeg|jpg|png)$');
    const imageFile = imageFiles.find(f => imagePattern.test(f));
    if (!imageFile) {
      console.warn(`No matching image for audio: ${audioFile}`);
      continue;
    }

    const audioPath = path.join(audioDir, audioFile);
    const imagePath = path.join(imageDir, imageFile);
    const videoPath = path.join(videoDir, audioFile.replace(/\.mp3$/, '.mp4'));

    let audioDuration;
    try {
      audioDuration = await getAudioDuration(audioPath);
    } catch (e) {
      console.error(`Failed to get duration for ${audioFile}:`, e);
      continue;
    }

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop()
        .input(audioPath)
        .duration(audioDuration)
        .outputOptions([
          '-c:v libx264',
          '-tune stillimage',
          '-c:a aac',
          '-b:a 192k',
          '-pix_fmt yuv420p'
        ])
        .output(videoPath)
        .on('start', cmd => console.log(`FFmpeg: ${cmd}`))
        .on('end', () => {
          console.log(`✅ Created video: ${videoPath}`);
          resolve();
        })
        .on('error', err => {
          console.error(`❌ Error for ${audioFile}:`, err);
          reject(err);
        })
        .run();
    });
  }
}

processAll();

const videoFiles = fs.readdirSync(videoDir).filter(file => file.endsWith('.mp4'));

// Step 1: Extract unique base names ending with .pdf from video files
const baseNames = [];
const baseNameSet = new Set();
for (const videoFile of videoFiles) {
  const match = videoFile.match(/^(.*\.pdf)_\d+\.mp4$/);
  if (match) {
    const base = match[1];
    if (!baseNameSet.has(base)) {
      baseNames.push(base);
      baseNameSet.add(base);
    }
  }
}
console.log(`Found ${baseNames.length} unique base names for video files.`);
console.log(baseNames);
// Step 2: For each base name, upload files with incrementing _1, _2, ... until missing
for (const base of baseNames) {
  let idx = 1;
  while (true) {
    const videoName = `${base}_${idx}.mp4`;
    const localFilePath = path.join(videoDir, videoName);
    if (!fs.existsSync(localFilePath)) {
      break;
    }
    try {
      await storage.bucket(bucketName).upload(localFilePath, {
        destination: videoName,
        metadata: {
          contentType: 'video/mp4',
        },
      });
      console.log(`Uploaded ${videoName} to bucket ${bucketName}`);
    } catch (error) {
      console.error(`Error uploading ${videoName}:`, error);
    }
    idx++;
  }
}


