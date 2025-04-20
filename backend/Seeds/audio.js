


import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load environment variables from .env file


import OpenAI from 'openai';
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
  } from "@google/genai";
  
   const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
   const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }); 


const uploadsDir = path.join(__dirname, '..', 'uploads');


// Read all files from the uploads directory
const filesInUploads = fs.readdirSync(uploadsDir);

// Filter for PDF files that start with 'Lecture 5'
const pdfFiles = filesInUploads.filter(file =>
  path.extname(file).toLowerCase() === '.pdf' 
);

const sanitizedpdfFiles = pdfFiles.map(file => {  
  
  return file.replace(/[\/\\?%*:|"<>]/g, '_');
});


console.log(`Found ${sanitizedpdfFiles.length} PDF files starting with 'Lecture 5' to process in ${uploadsDir}`);

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


  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
    // Continue to the next file if one fails
  }
  // Upload a file to Google GenAI
   const myfile = await client.files.upload({
    file: filename,
    config: { mimeType: "application/pdf" },
  });
  const prompt = `You are a teacher helping students understand course material. You are provided with content extracted from a PDF file, one page at a time.
          Your explanations should:
        - Be clear and structured
        - Teach the content like you're explaining to students 
        - Use examples or analogies where helpful(Rarely)
        - Be concise and to the point
        - Highlight key points and important takeaways
        - Avoid just summarizing or repeating the text:
        For each page, generate a JSON object with the following schema:

        index should be from 1 to total number of pages:${totalPages}

  Slide = {'index': number,  'explanation': string}
  Return: Array<Slide>`;
  
  
  

const response = await client.models.generateContent({
  model: "gemini-2.5-pro-preview-03-25",
  contents: createUserContent(
    
    [
      createPartFromUri(myfile.uri, myfile.mimeType),
    prompt,
  ]

),
});

 

   // Get the text content from the response
   const responseText = response.text; // Assuming response.text contains the JSON string
   console.log('Raw Response from Google GenAI:', responseText);
 
   let slides = null; // Declare slides outside the try block
 
   try {
     // Attempt to extract JSON from within Markdown code blocks
     let jsonString = responseText;
     const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/); // Regex to find ```json ... ```
 
     if (jsonMatch && jsonMatch[1]) {
       // If found, use the content inside the fences
       jsonString = jsonMatch[1].trim();
       console.log('Extracted JSON string:', jsonString);
     } else {
       // Fallback: If no fences found, try trimming the whole response
       // This might help if there's just leading/trailing whitespace
       jsonString = responseText.trim();
       console.log('No JSON fences found, attempting to parse trimmed response.');
     }
 
     let cleanedJsonString = jsonString
     .replace(/\n/g, "") // Replace literal newline with escaped newline
     .replace(/\r/g, ""); // Replace literal carriage return with escaped carriage return
  // You might need to add .replace(/\t/g, "\\t") if tabs cause issues

  console.log('Cleaned JSON string (attempting parse):', cleanedJsonString); // Log the cleaned string

  // Parse the CLEANED JSON string
  slides = JSON.parse(cleanedJsonString);
  // --- End cleaning and parsing ---
 
     // Check if the parsed result is an array
     if (Array.isArray(slides)) {
       console.log("\n--- Parsed Slide Data ---");
       
     } else {
       console.error("Parsed response is not an array:", slides);
       slides = null; // Reset slides if parsing didn't result in an array
     }
 
   } catch (error) {
     console.error("Failed to parse JSON response:", error);
     // Log the raw text again if parsing fails, to help debug
     console.error("Raw text that failed parsing:", responseText);
     slides = null; // Ensure slides is null if parsing failed
   }

 
  for (const slide of slides) {
   
    const speechFile = path.resolve(`./audio/${file}_${slide.index}.mp3`);
    const mp3 = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "ash",
    input:  slide.explanation,
    instructions: "Read the text like a teacher explaining the content of the page in detail",
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}


  }