
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Parser } from 'json2csv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import 'dotenv/config'; // Load environment variables from .env file
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
     Type 
  } from "@google/genai";
  
   const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });


const uploadsDir = path.join(__dirname, "..", 'uploads');
import {Storage} from '@google-cloud/storage';


const storage = new Storage({
    keyFilename: path.join(__dirname, ".." ,'ele888-441ef279cf14.json'), // path to your downloaded JSON key
  });
  
const bucketName = 'ele888-bucket';

// Read all files from the uploads directory
const filesInUploads = fs.readdirSync(uploadsDir);

// Filter for PDF files that start with 'Lecture 5'
const pdfFiles = filesInUploads.filter(file =>
  path.extname(file).toLowerCase() === '.pdf' 
);

const sanitizedpdfFiles = pdfFiles.map(file => {  
  
  return file.replace(/[\/\\?%*:|"<>]/g, '_');
});


/**
 * Gemini sometimes emits LaTeX back‑slashes that are not valid JSON
 * escapes (e.g. “\lambda”).  This doubles every back‑slash that is
 * *not* already a legal JSON escape so JSON.parse will not choke.
 */


function sanitizeJsonString(raw) {
  return raw
    /* 1 ─ double every "\" that isn’t already a valid JSON escape  */
    .replace(/\\(?![\\/"bfnrtu])/g, '\\\\')
    /* 2 ─ strip the two JS line‑separator chars that JSON forbids  */
    .replace(/\u2028|\u2029/g, '')
    /* 3 ─ escape real control characters inside the text           */
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')      // do \r first so we don’t double‑escape
    .replace(/\t/g, '\\t');
}


// let McqArr = [];
let QAsArr = [];
console.log(`Found ${sanitizedpdfFiles.length} PDF files to process in ${uploadsDir}`);

for( const file of sanitizedpdfFiles) {
  const filename = "uploads" + "/" + file;
  const fullPath = path.join(uploadsDir, file);
  let totalPages = null;
  try {
    // 1. Read the PDF file into bytes
    const existingPdfBytes = fs.readFileSync(fullPath);

    // 2. Load the PDF document
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 3. Get the number of pages (length)
    totalPages = pdfDoc.getPageCount();

    console.log(`File: ${file}, Length (Pages): ${totalPages}`);

    // --- You can now use 'totalPages' for this specific file ---
    // Example: Split the PDF based on totalPages, etc.

  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
    // Continue to the next file if one fails
  }
  // Upload a file to Google GenAI
   const myfile = await client.files.upload({
    file: filename,
    config: { mimeType: "application/pdf" },
  });
//   const prompt = `Looking at the content of the pdf generate.
//   List as many as possible multiple choice questions related to machine learning.
//   Multiple choice questions as a JSON object with the following schema:
//   MCQs = {'question': string,  'options': Array<string>, 'answer': string}
//   Return: Array<MCQs>`;
  
  
  


// const response = await client.models.generateContent({
//   model: "gemini-2.5-pro-preview-03-25",
//   contents: createUserContent(
//     [
//       createPartFromUri(myfile.uri, myfile.mimeType),
//     prompt,
//   ]

// ),
// });

const prompt2 = `All the pdfs are provided with problem solving question. Identify that question and then generate questions similar to that calibar and also provide solutions for them. 
    List as many as possible question answers Related to machine learning.
    Make sure that the equations are in latex format for both questions and answers.
    `;
  

 

   // Get the text content from the response
  //  const responseText = response.text; // Assuming response.text contains the JSON string
  //  console.log('Raw Response from Google GenAI:', responseText);
   
   const response2 = await client.models.generateContent({
    model: "gemini-2.5-pro-preview-03-25",
    contents: createUserContent(
      
      [
        createPartFromUri(myfile.uri, myfile.mimeType),
      prompt2,
    ]
    
  
  ),
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                'question': {
                    type: Type.STRING,
                    description: 'The question to be answered',
                    nullable: false,
                },
                'answer': {
                    type: Type.STRING,
                    description: 'The answer to the question',
                    nullable: false,
                },
            },
            required: ['question', 'answer'],

        },
    },
},
  });
   const responseText2 = response2.text; // Assuming response.text contains the JSON string
    console.log('Raw Response from Google GenAI:', responseText2);
 
  //  let Mcqs = null; // Declare slides outside the try block
    
   try {
     // Attempt to extract JSON from within Markdown code blocks
    //  let jsonString = responseText;
    //  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/); // Regex to find ```json ... ```
    //  if (jsonMatch && jsonMatch[1]) {
    //    // If found, use the content inside the fences
    //    jsonString = jsonMatch[1].trim();
    //    console.log('Extracted JSON string:', jsonString);
    //  } else {
    //    // Fallback: If no fences found, try trimming the whole response
    //    // This might help if there's just leading/trailing whitespace
    //    jsonString = responseText.trim();
    //    console.log('No JSON fences found, attempting to parse trimmed response.');
    //  }
 
    //  // Parse the extracted (or trimmed) JSON string
    //  Mcqs = JSON.parse(jsonString);
 
    //  // Check if the parsed result is an array
    //  if (Array.isArray(Mcqs)) {
    //    console.log("\n--- Parsed MCQs Data ---");
       
    //  } else {
    //    console.error("Parsed response is not an array:", Mcqs);
    //    slides = null; // Reset slides if parsing didn't result in an array
    //  }
     
    //  McqArr.push(...Mcqs);

    

     // Parse the extracted JSON string after sanitizing
     const responseText2 = response2.text; // Get the JSON string
     console.log('Raw Response from Google GenAI (QAs):', responseText2);

     let QAs = null; // Initialize QAs

     if (responseText2) { // Ensure the response text is not empty
       // Explicitly parse the JSON string
       const parsedJson = JSON.parse(responseText2);

       // Assign the parsed object/array to QAs
       QAs = parsedJson;

       // Check if the parsed result is an array
       if (Array.isArray(QAs)) {
         console.log("\n--- Parsed question and answer Data ---");
         // Note: The order of keys ('answer', 'question') within each object
         // in the array is not guaranteed by JSON format, but the data is correct.
       } else {
         console.error("Parsed response is not an array:", QAs);
         QAs = null; // Reset QAs if parsing didn't result in an array
       }
     } else {
        console.error("Received empty response text for QAs.");
        QAs = null;
     }

     if (QAs) { // Only push if QAs is a valid array
        QAsArr.push(...QAs);
     }



   } catch (error) {
     console.error("Failed to parse JSON response:", error);
     // Log the raw text again if parsing fails, to help debug
     console.error("Raw text that failed parsing:");
    //  Mcqs = null; // Ensure slides is null if parsing failed
   }



  }

  // Convert the array of objects to CSV format
  const json2csvParser = new Parser();
  let csv = null;
  let csvFilePath = null;
  //  csv = json2csvParser.parse(McqArr);
  // // Write the CSV to a file
  // csvFilePath = path.join(__dirname, "..", 'CSV/mcqs.csv');
  // fs.writeFileSync(csvFilePath, csv);
  // console.log(`CSV file created at: ${csvFilePath}`);

   csv = json2csvParser.parse(QAsArr);
  // Write the CSV to a file
  csvFilePath = path.join(__dirname, '..', 'CSV/QAs.csv');
  fs.writeFileSync(csvFilePath, csv);
  console.log(`CSV file created at: ${csvFilePath}`);
  // Upload the CSV file to Google Cloud Storage
  const csvDir = path.join(__dirname, "..", 'CSV');
  const csvFiles = fs.readdirSync(csvDir).filter(file => file.endsWith('.csv'));
  for (const csvFile of csvFiles) {
    const localFilePath = path.join(csvDir, csvFile);
    try {
      await storage.bucket(bucketName).upload(localFilePath, {
        destination: csvFile,
        metadata: {
          contentType: 'text/csv',
        },
      });
      console.log(`Uploaded ${csvFile} to bucket ${bucketName}`);
    } catch (error) {
      console.error(`Error uploading ${csvFile}:`, error);
    }
  }
