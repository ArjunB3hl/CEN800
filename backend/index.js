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
const result = clearUploadsFolder();
if (result.success) {
  console.log('Uploads folder cleared successfully');
} else {
  console.error('Error clearing uploads folder:', result.message);
}

// Call the deleteFilesFromAI function to delete files from Google GenAI
deleteFilesFromAI()
  .then(() => console.log('Files deleted from Google GenAI'))
  .catch((error) => console.error('Error deleting files from Google GenAI:', error));

// Add an endpoint to trigger the file cleanup
app.delete('/uploads', (req, res) => {
  const result = clearUploadsFolder();
  if (result.success) {
    res.status(200).send(result);
  } else {
    res.status(500).send(result);
  }
});


// POST endpoint for multiple file uploads
app.post('/upload', upload.array('files', 10), async (req, res) => {
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

  const prompt = `List many multiple choice questions using this JSON schema:

  MultipleChoice = {'question': string, 'options': Array<string>, 'answer': string}
  Return: Array<MultipleChoice>`;
  

 
  


const response = await client.models.generateContent({
  model: "gemini-2.5-pro-preview-03-25",
  contents: createUserContent(
    
    [
      ...myfiles,
    prompt,
  ]

),
});

  console.log('Response from Google GenAI:', response.text);
  


  
  // Here you would typically store metadata about the files (e.g., in a database)
  // For now, we just confirm receipt
  res.status(200).send({
    message: `${req.files.length} file(s) uploaded successfully!`,
    files: req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    }))
  });

}); 
  


// GET endpoint to check server status
app.get('/status', (req, res) => {
  res.status(200).send({ status: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
