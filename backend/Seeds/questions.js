
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
    keyFilename: path.join(__dirname, ".." ,'cen800-39e49721ec16.json'), // path to your downloaded JSON key
  });
  
const bucketName = 'cen800';
/*
// Read all files from the uploads directory
const filesInUploads = fs.readdirSync(uploadsDir);

// Filter for PDF files that start with 'Lecture 5'
const pdfFiles = filesInUploads.filter(file =>
  path.extname(file).toLowerCase() === '.pdf' 
);

const sanitizedpdfFiles = pdfFiles.map(file => {  
  
  return file.replace(/[\/\\?%*:|"<>]/g, '_');
});


let McqArr = [];
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
  const prompt = `Looking at the content of the pdf generate.
  List as many as possible multiple choice questions related to the contents of pdf.
`;
  
  
  
const response = await client.models.generateContent({
  model: "gemini-2.5-pro-preview-03-25",
  contents: createUserContent(
    [
      createPartFromUri(myfile.uri, myfile.mimeType),
    prompt,
  ]

),
config: {
  responseMimeType: 'application/json',
  responseSchema: {
      type: Type.ARRAY, // Expecting an array of MCQs
      items: {
          type: Type.OBJECT, // Each item in the array is an object
          properties: { // Define the properties of each MCQ object
              'question': {
                  type: Type.STRING,
                  description: 'The multiple-choice question text',
                  nullable: false,
              },
              'options':  {
                  type: Type.ARRAY, // Options is an array of strings
                  items: {
                      type: Type.STRING,
                      description: 'A possible answer choice',
                      nullable: false,
                  },
                  description: 'An array of 4 possible answer choices (A, B, C, D)', // Added more description
                  nullable: false,
              },
              // 'answer' should be a direct property here, not inside 'options'
              'answer': {
                  type: Type.STRING,
                  description: 'The correct answer string (should match one of the options)',
                  nullable: false,
              },
          }, // End of properties object
          // 'required' should be here, sibling to 'type' and 'properties'
          required: ['question', 'options', 'answer'],
      }, // End of items object
  }, // End of responseSchema
} // End of config

});

const prompt2 = `You are an expert AI tutor. The content of a PDF document is provided below:

<<PDF_CONTENT>>

1. Carefully read and understand the key concepts, definitions, and processes described in the PDF.
2. Create a realistic, real‑world scenario or case study that applies at least three of these concepts in practice.
3. Based on that scenario, generate five multiple‑choice questions that test comprehension and application of the PDF’s content. For each question:
   - Provide a clear question stem.
   - Give four answer choices labeled A, B, C, and D.
   - Indicate which choice is correct.
   - Include a brief explanation of why that answer is correct.

Format your response like this:

Scenario:
<Your narrative case study here>

Questions:
1. <Question 1 stem>
   A. <Option A>
   B. <Option B>
   C. <Option C>
   D. <Option D>
   Correct Answer: <A/B/C/D>

…repeat for questions 2 through 5.
`;
  

 

   // Get the text content from the response
  const responseText = response.text; // Assuming response.text contains the JSON string
  console.log('Raw Response from Google GenAI for response1:', responseText);
   
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
          type: Type.OBJECT, // Top level is an object
          properties: { // Properties of the top-level object
              'scenario': {
                  type: Type.STRING,
                  description: 'The case study or scenario',
                  nullable: false,
              },
              'questions': {
                  type: Type.ARRAY, // 'questions' is an array
                  items: { // Define the structure of each item in the 'questions' array
                      type: Type.OBJECT,
                      properties: {
                          'question': {
                              type: Type.STRING,
                              description: 'The question text', // Changed description slightly
                              nullable: false,
                          },
                          'options':  {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.STRING,
                                  description: 'A possible answer choice', // Changed description
                                  nullable: false,
                              },
                              description: 'An array of 4 answer choices', // Changed description
                              nullable: false,
                          },
                          // 'answer' should be a direct property of the question object
                          'answer': {
                              type: Type.STRING,
                              description: 'The correct answer choice', // Changed description
                              nullable: false,
                          },
                      }, // End of properties for question object
                      // Required properties for each question object
                      required: ['question', 'options', 'answer'],
                  }, // End of items definition for questions array
              }, // End of 'questions' property definition
          }, // End of properties for top-level object
          // 'required' for the top-level object should be here
          required: ['scenario', 'questions'],
      }, // End of responseSchema
    }, // End of config
  });
  
   const responseText2 = response2.text; // Assuming response.text contains the JSON string
    console.log('Raw Response from Google GenAI: for response 2', responseText2);
 

    
   try {
    let Mcqs = null; 
    
    if(responseText)  { // Ensure the response text is not empty
      // Explicitly parse the JSON string
      const parsedJson = JSON.parse(responseText);
      // Assign the parsed object/array to Mcqs
      Mcqs = parsedJson;
      // Check if the parsed result is an array 
      if (Array.isArray(Mcqs)) {
        console.log("\n--- Parsed Slide Data ---");
        // Note: The order of keys ('answer', 'question') within each object
        // in the array is not guaranteed by JSON format, but the data is correct.
      } else {
        console.error("Parsed response is not an array:", Mcqs);
        Mcqs = null; // Reset slides if parsing didn't result in an array
      }
    }
    else {
      console.error("Received empty response text for Mcqs.");
      Mcqs = null;
    }

    if (Mcqs) { // Only push if Mcqs is a valid array
      McqArr.push(...Mcqs);
    }
    

     let QAs = null; // Initialize QAs

     if (responseText2) { // Ensure the response text is not empty
       const parsedJson = JSON.parse(responseText2);

       // Validate the structure: must be an object with scenario (string) and questions (array)
       if (
         typeof parsedJson === 'object' &&
         parsedJson !== null &&
         typeof parsedJson.scenario === 'string' &&
         Array.isArray(parsedJson.questions)
       ) {
         const scenario = parsedJson.scenario;
         const questionsArray = parsedJson.questions; // Get the original questions array

         // Check if there are any questions to modify
         if (questionsArray.length > 0) {
           // Prepend the scenario to the first question's text
           // Ensure the first question object and its question property exist
           if (questionsArray[0] && typeof questionsArray[0].question === 'string') {
             questionsArray[0].question = `Scenario:\n${scenario}\n\nQuestion:\n${questionsArray[0].question}`;
             console.log("\n--- Prepended scenario to the first question ---");
           } else {
             console.warn("First question object or its 'question' property is invalid. Cannot prepend scenario.");
           }
         } else {
           console.warn("Received empty questions array. Cannot prepend scenario.");
         }

         // Assign the potentially modified questions array to QAs
         QAs = questionsArray;

       } else {
         console.error("Parsed response for response2 is not the expected object structure ({scenario: string, questions: array}):", parsedJson);
         QAs = null; // Reset QAs if structure is wrong
       }
     } else {
        console.error("Received empty response text for response2.");
        QAs = null;
     }

     if (QAs && Array.isArray(QAs)) { // Ensure QAs is a valid array before pushing
        // Now push the modified questions array (which includes the scenario in the first question)
        QAsArr.push(QAs);
     } else if (QAs) {
        // This case handles if QAs was assigned but wasn't an array (shouldn't happen with current logic, but good practice)
        console.error("Processed QAs data is not an array:", QAs);
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
   csv = json2csvParser.parse(McqArr);
  // Write the CSV to a file
  csvFilePath = path.join(__dirname, "..", 'CSV/mcqs.csv');
  fs.writeFileSync(csvFilePath, csv);
  console.log(`CSV file created at: ${csvFilePath}`);

   csv = json2csvParser.parse(QAsArr);
  // Write the CSV to a file
  csvFilePath = path.join(__dirname, '..', 'CSV/QAs.csv');
  fs.writeFileSync(csvFilePath, csv);
  console.log(`CSV file created at: ${csvFilePath}`);
  // Upload the CSV file to Google Cloud Storage
  */
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
