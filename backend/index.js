import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load environment variables from .env file

// Replicate __dirname functionality in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });



async function main() {
  // Upload a file to Google GenAI
  /* const myfile = await client.files.upload({
    file: "uploads/1744331605672-ele709_formula_sheet.pdf",
    config: { mimeType: "application/pdf" },
  });
  */

 // Get a reponse 
  /* const response = await client.models.generateContent({
    model: "gemini-2.5-pro-preview-03-25",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Describe the files in detail",
    ]),
  }); */
   const listResponse = await client.files.list({ config: { pageSize: 10 } });
   // delete thie files
  for await (const file of listResponse) {
       console.log(file.name);
       await client.files.delete({ name: file.name});
  } 
       
  
}


const app = express();
const port = 3001; // Port for the backend server

// Enable CORS for requests from the frontend (adjust origin if needed)
app.use(cors({ origin: 'http://localhost:5173' })); // Assuming Vite runs on 5173
app.use(express.json());

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log(`Created directory: ${uploadsDir}`);
}

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Save files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Keep the original filename, potentially adding a timestamp for uniqueness if needed
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });



// Add this function to delete all files in the uploads directory
function clearUploadsFolder() {
  try {
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      console.log('Uploads folder is already empty');
      return { success: true, message: 'Uploads folder is already empty', deletedCount: 0 };
    }
    
    let deletedCount = 0;
    
    for (const file of files) {
      // Avoid deleting .gitkeep or other special files if needed
      if (file === '.gitkeep' || file === '.DS_Store') continue;
      
      const filePath = path.join(uploadsDir, file);
      
      // Check if it's actually a file (not a directory)
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Deleted ${deletedCount} files from uploads folder`);
    return { success: true, message: `Deleted ${deletedCount} files from uploads folder`, deletedCount };
  } catch (error) {
    console.error('Error clearing uploads folder:', error);
    return { success: false, message: `Error clearing uploads folder: ${error.message}` };
  }
}

async function deleteFilesFromAI() {
  const listResponse = await client.files.list({ config: { pageSize: 10 } });
  // delete thie files
 for await (const file of listResponse) {
      console.log(file.name);
      await client.files.delete({ name: file.name});
 } 


}
// Call the clearUploadsFolder function to delete files from the local uploads directory
/*const result = clearUploadsFolder();
if (result.success) {
  console.log('Uploads folder cleared successfully');
} else {
  console.error('Error clearing uploads folder:', result.message);
}

// Call the deleteFilesFromAI function to delete files from Google GenAI
deleteFilesFromAI()
  .then(() => console.log('Files deleted from Google GenAI'))
  .catch((error) => console.error('Error deleting files from Google GenAI:', error));
  */

// Add an endpoint to trigger the file cleanup
app.delete('/uploads', (req, res) => {
  const result = clearUploadsFolder();
  if (result.success) {
    res.status(200).send(result);
  } else {
    res.status(500).send(result);
  }
});


// Middleware to clear uploads directory before handling new file uploads
const clearUploadsMiddleware = async (req, res, next) => {
  try {
    const result = await clearUploadsFolder();
    console.log('Uploads folder cleared via middleware:', result);
    
    // Also clear Gemini AI files
    try {
      await deleteFilesFromAI();
      console.log('Gemini AI files cleared via middleware');
    } catch (error) {
      console.error('Error clearing Gemini AI files:', error);
      // Continue anyway - don't block the upload
    }
    
    next(); // Continue to the next middleware/handler
  } catch (error) {
    console.error('Error in clearUploadsMiddleware:', error);
    return res.status(500).json({ error: 'Failed to clear uploads directory' });
  }
};

// POST endpoint for multiple file uploads - now with middleware
app.post('/upload', clearUploadsMiddleware, upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send({ message: 'No files uploaded.' });
  }
  
  console.log('Files received:', req.files.map(file => file.filename).join(', '));

  // Here you can process the files as needed
  // For example, you can send them to Google GenAI or perform other operations
  // For now, we just log the filenames
  let myfile = null;
  let myfiles = [];
  

  for(const file of req.files) {
      myfile = await client.files.upload({
        file: file.path,
        config: { mimeType: file.mimetype },
      }) ;

      myfiles.push(createPartFromUri(myfile.uri, myfile.mimeType));

  }

  const prompt1 = `List many multiple choice questions using this JSON schema:

  MultipleChoice = {'question': string, 'options': Array<string>, 'answer': string}
  Return: Array<MultipleChoice>`;
  
  const prompt2 = `List many questions and answers that involve reasoning, problem solving and thinking using this JSON schema:

  QuestionAnswer= {'question': string, 'answer': string}
  Return: Array<QuestionAnswer>`;
 
  


const response1 = await client.models.generateContent({
  model: "gemini-2.5-pro-preview-03-25",
  contents: createUserContent(
    
    [
      ...myfiles,
    prompt1,
  ]

),
});
const response2 = await client.models.generateContent({
  model: "gemini-2.5-pro-preview-03-25",
  contents: createUserContent(
    
    [
      ...myfiles,
    prompt2,
  ]

),
});

  console.log('Response from Google GenAI:', response2.text);
  
  // Parse the response text to extract MCQ data
  let mcqData = [];
  try {
    // The response might be JSON or have JSON embedded in text
    // Try direct parsing first
    const responseText = response1.text;
    
    // Look for an array pattern in the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      mcqData = JSON.parse(jsonMatch[0]);
    } else {
      console.log('Could not extract JSON array from response');
    }
  } catch (error) {
    console.error('Error parsing MCQ data:', error);
  }

  // Parse the question answers
  let questionAnswerData = [];
  try {
    // The response might be JSON or have JSON embedded in text
    // Try direct parsing first
    const responseText = response2.text;
    
    // Look for an array pattern in the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      questionAnswerData = JSON.parse(jsonMatch[0]);
    } else {
      console.log('Could not extract JSON array from response');
    }
  } catch (error) {
    console.error('Error parsing question answer data:', error);
  }

  
  // Send both file metadata and MCQ data to frontend
  res.status(200).send({
    message: `${req.files.length} file(s) uploaded successfully!`,
    files: req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    })),
    mcqData: mcqData,
    questionAnswerData: questionAnswerData,
  });

}); 

// Check if the answer is correct

app.post('/check-answer', async (req, res) => {
  const { question, userAnswer, correctAnswer } = req.body;
  
  if (!question || !userAnswer) {
    return res.status(400).send({ error: 'Question and user answer are required' });
  }
  
  const prompt = `The user was given this question: "${question}"
  
User's answer: "${userAnswer}"
Correct answer: "${correctAnswer}"

Evaluate if the user's answer is correct using the following JSON schema:
{'Correct': boolean, 'Judgement': string}

The 'Correct' field should be true if the user's answer is semantically correct, even if the wording is different.
The 'Judgement' field should provide a brief explanation of why the answer is correct or incorrect.

Return the result as valid JSON.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-pro-preview-03-25",
      contents: createUserContent([prompt]),
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
