import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fromPath } from 'pdf2pic';
// Importing the required libraries
// pdf-lib for PDF manipulation
// pdf2pic for PDF to image conversion
// fs and path for file system operations
// Define the directories for uploads and images
// Replicate __dirname functionality in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { fileURLToPath } from 'url';



const uploadsDir = path.join(__dirname, '..', 'uploads');
const saveDir = path.join(__dirname, '..', 'images');
// Read all files from the uploads directory
const filesInUploads = fs.readdirSync(uploadsDir);




(async () => {
  for (const file of filesInUploads) {
    if (path.extname(file).toLowerCase() === '.pdf') {
      const pdfPath = path.join(uploadsDir, file);


        let totalPages = 0;
        try {
          const pdfBytes = fs.readFileSync(pdfPath);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          totalPages = pdfDoc.getPageCount();
          
          console.log(`  Found ${totalPages} pages in ${file}.`);
        } catch (pdfLibError) {
          console.error(`  Error loading ${file} with pdf-lib:`, pdfLibError);
        }

        const options = {
            density: 1000,           // increase DPI (default is 72–100)
            saveFilename: path.parse(file).name + '.pdf' ,
            savePath: saveDir,
            format: "png",          // use lossless PNG or set "jpeg"
            quality: 100, 
            width: 3200,           // set image width
            height: 2600,          // set image height
          };

      const convert = fromPath(pdfPath, options);

       // --- Loop through pages and convert each one ---
       let convertedCount = 0;
       for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
         try {
           const result = await convert(pageNum, { responseType: 'image' });
           // console.log(`    Converted page ${pageNum}:`, result); // Log individual page result if needed
           convertedCount++;
         } catch (pageError) {
           console.error(`    Error converting page ${pageNum} of ${file}:`, pageError);
           // Optionally break or continue based on whether one page error should stop all
         }
       }
       console.log(`  Successfully converted ${convertedCount} out of ${totalPages} pages for ${file}.`);
       // --- End loop ---

    
    }
  }
  console.log('Finished PDF to image conversion.');
})();
