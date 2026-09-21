const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config();

const HF_TOKEN = process.env.EXPO_PUBLIC_HUGGINGFACE_TOKEN;

if (!HF_TOKEN) {
  console.error("EXPO_PUBLIC_HUGGINGFACE_TOKEN is missing in .env");
  process.exit(1);
}

const MODELS_DIR = path.join(__dirname, '../assets/models');

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

const FILES_TO_DOWNLOAD = [
  {
    url: 'https://huggingface.co/Quran-Lab/zipformer_p-arabic-v3/resolve/main/zipformer_p_arabic_v3.1.int8.onnx',
    dest: 'quran_phoneme_zipformer_int8.onnx',
  },
  {
    url: 'https://huggingface.co/Quran-Lab/zipformer_p-arabic-v3/resolve/main/tokens.txt',
    dest: 'tokens.txt',
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    const file = fs.createWriteStream(destPath);
    const options = {
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
      }
    };
    
    const request = https.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log(`Redirecting to ${response.headers.location}...`);
        // Redownload with the new URL, without the auth header if redirecting to a pre-signed S3 URL
        const redirectOptions = response.headers.location.includes('s3.amazonaws.com') || response.headers.location.includes('cloudfront.net') 
            ? {} 
            : options;
            
        https.get(response.headers.location, redirectOptions, (redirectRes) => {
           redirectRes.pipe(file);
           file.on('finish', () => {
             file.close(resolve);
           });
        }).on('error', (err) => {
           fs.unlink(destPath, () => reject(err));
        });
        return;
      }
      
      if (response.statusCode !== 200) {
        fs.unlink(destPath, () => reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`)));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    });

    request.on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

async function run() {
  for (const file of FILES_TO_DOWNLOAD) {
    const destPath = path.join(MODELS_DIR, file.dest);
    try {
      await downloadFile(file.url, destPath);
      console.log(`Successfully saved ${file.dest}`);
    } catch (err) {
      console.error(`Error downloading ${file.dest}:`, err.message);
    }
  }
}

run();
