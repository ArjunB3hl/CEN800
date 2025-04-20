import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load environment variables from .env file
import pkg from 'csv-parser';



const csvParser = pkg;


// Replicate __dirname functionality in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import genai from '@google/genai';

// Destructure off the default
const {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
  createPartFromBase64,           // ← now this is the runtime class
} = genai;


const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
import {Storage} from '@google-cloud/storage';


const storage = new Storage({
    keyFilename: path.join(__dirname ,'ele888-441ef279cf14.json'), // path to your downloaded JSON key
  });
  
const bucketName = 'ele888-bucket';

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}
const app = express();
const port = 3001; // Port for the backend server

// Enable CORS for requests from the frontend (adjust origin if needed)
app.use(cors({ origin: 'http://localhost:5173' })); // Assuming Vite runs on 5173
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024, // limit file size to 12MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only jpeg and png files
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG files are allowed'), false);
    }
  }
});

app.get('/videos', async (req, res) => {
  console.log(`Received request for videos with query:`, req.query); // Log request
  const lecturePrefix = req.query.lecture;
  if (!lecturePrefix || typeof lecturePrefix !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid lecture query parameter' });
  }

  try {
    // List all .mp4 files in the bucket that start with the lecture prefix
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: '', // No folder prefix, just filter by name below
    });

    console.log(`Found ${files.length} files in the bucket.`); // Log number of files found
    
   

    // Normalize the lecture prefix by removing all spaces
    const normalizedLecturePrefix = lecturePrefix.replace(/\s+/g, '').toLowerCase();



    // Filter and map files that match the lecture prefix and .mp4 extension
    const matchingFiles = files
      .filter(file => {
        const normalizedFileName = file.name.replace(/\s+/g, '').toLowerCase();
          
         return normalizedFileName.startsWith(normalizedLecturePrefix) && file.name.endsWith('.mp4')

      }


      )
      .map(file => ({
        name: file.name,
        filelink: `https://storage.googleapis.com/${bucketName}/${file.name}`,
        timeCreated: file.metadata.timeCreated,
      }));

    // Sort by timeCreated (oldest to newest)
    matchingFiles.sort((a, b) => new Date(a.timeCreated) - new Date(b.timeCreated));

    // Return just the file names in order
    const videoFiles = matchingFiles.map(f => [f.name, f.filelink]);


    console.log(`Sending ${videoFiles.length} video files for lecture "${lecturePrefix}":`, videoFiles); // Log response
    res.status(200).json({ videos: videoFiles });
  } catch (error) {
    console.error(`Error fetching video files for lecture "${lecturePrefix}":`, error); // Log error with context
    res.status(500).json({ error: 'Failed to fetch video files' });
  }
});

app.get('/questions', async (req, res) => {
  try {
    // --- Load ALL MCQs first ---
    const allMcqs = [];
    await new Promise((resolve, reject) => {
      storage
        .bucket(bucketName)
        .file('mcqs.csv')
        .createReadStream()
        .pipe(csvParser())
        .on('data', row => {
          try {
            // Basic validation for row structure
            if (row.question && row.options && row.answer) {
              allMcqs.push({
                question: row.question,
                // Safely parse options, handle potential errors
                options: JSON.parse(row.options),
                answer: row.answer
              });
            } else {
              console.warn('Skipping invalid MCQ row:', row);
            }
          } catch (parseError) {
            console.error('Error parsing options for MCQ row:', row, parseError);
            // Skip rows with invalid JSON in options
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // --- Shuffle the loaded MCQs ---
    const shuffledMcqs = shuffleArray([...allMcqs]); // Use spread to avoid modifying the original array if needed elsewhere

    // --- Select up to 30 random MCQs ---
    const selectedMcqs = shuffledMcqs.slice(0, 30);

    // --- Load up to 5 Q&As (no change needed here unless you want random Q&As too) ---
    const qas = [];
    await new Promise((resolve, reject) => {
      storage
        .bucket(bucketName)
        .file('QAs.csv') // Assuming QAs.csv exists
        .createReadStream()
        .pipe(csvParser())
        .on('data', row => {
          // Basic validation for row structure
          if (row.question && row.answer ) {
             qas.push({
               question: row.question,
               answer: row.answer
             });
          } else {
             console.warn('Skipping invalid Q&A row:', row);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // --- Shuffle the loaded QAs ---
    const shuffledQAs = shuffleArray([...qas]); // Use spread to avoid modifying the original array if needed elsewhere

    // --- Select up to 30 random MCQs ---
    const selectedQAs = shuffledQAs.slice(0,5);

    // --- Send to frontend ---
    console.log(`Sending ${selectedMcqs.length} random MCQs and ${selectedQAs.length} Q&As.`);
    res.status(200).json({ mcqs: selectedMcqs, selectedQAs }); // Send the selected random MCQs

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Check if the answer is correct
app.post('/check-answer', upload.array('images', 10), async (req, res) => {
  const { question, userAnswer, correctAnswer } = req.body;
  
  if (!question || !userAnswer) {
    return res.status(400).send({ error: 'Question and user answer are required' });
  }
  
  try {
    console.log('Checking answer with images:', req.files?.length || 0);
    
    // Create the prompt about the question and answer
    const prompt = `The user was given this question: "${question}"
  
User's answer: "${userAnswer}"
Correct answer: "${correctAnswer}"

${req.files && req.files.length > 0 ? 
  "The user has also provided images to support their answer. Please analyze these images as part of your evaluation." : 
  ""}
Evaluate if the user's answer is correct using the following JSON schema:
{'Correct': boolean, 'Judgement': string}

The 'Correct' field should be true if the user's answer is semantically correct, even if the wording is different.
The 'Judgement' field should provide a brief explanation of why the answer is correct or incorrect.

Return the result as valid JSON.`;

    let contentParts = [];
    
    
    // If there are image files, add them to the content parts
    if (req.files && req.files.length > 0) {
      // Add images to the request
      for (const file of req.files) {
        const b64 = file.buffer.toString('base64');
        const imagePart = createPartFromBase64(b64, file.mimetype);
        contentParts.push(imagePart);
      }
    }
    
    // Add the text prompt
    contentParts.push(prompt);
    
    // Use Gemini with vision if images are provided, otherwise use text-only mode
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: createUserContent(contentParts),
    });
    
    console.log('Answer evaluation response:', response.text);
    
    // Parse the response to extract the judgment
    let judgment = { Correct: false, Judgement: "Could not evaluate answer" };
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        judgment = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing judgment data:', error);
    }
    
    res.status(200).send(judgment);
  } catch (error) {
    console.error('Error evaluating answer:', error);
    res.status(500).send({ error: 'Error evaluating answer', details: error.message });
  }
});
  


// GET endpoint to check server status
app.get('/status', (req, res) => {
  res.status(200).send({ status: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
