import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib'; // Import PDFDocument from pdf-lib
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --- PDF Splitting Logic ---

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "..",'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log(`Uploads directory not found: ${uploadsDir}. Skipping PDF splitting.`);
  // Optionally create it: fs.mkdirSync(uploadsDir);
} else {
  // Read all files from the uploads directory
  const filesInUploads = fs.readdirSync(uploadsDir);

  // Filter for PDF files
  const pdfFiles = filesInUploads.filter(file => path.extname(file).toLowerCase() === '.pdf');

  console.log(`Found ${pdfFiles.length} PDF files to process in ${uploadsDir}`);

  // Process each PDF file
  for (const pdfFileName of pdfFiles) {
    const inputPdfPath = path.join(uploadsDir, pdfFileName);
    console.log(`\nProcessing: ${pdfFileName}`);

    try {
      const existingPdfBytes = fs.readFileSync(inputPdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const totalPages = pdfDoc.getPageCount();
     

      // Sanitize the metadata to remove invalid characters for filenames
      // Use the original filename (without extension) as a fallback if metadata is missing
      const baseFileName = path.parse(pdfFileName).name;
      const sanitizedMetadata = baseFileName.replace(/[\/\\?%*:|"<>]/g, '_'); // Sanitize base filename too

      let part = 1;
      for (let i = 0; i < totalPages; i += 10) {
        const newPdf = await PDFDocument.create();
        const pageRange = Array.from({ length: Math.min(10, totalPages - i) }, (_, idx) => i + idx);
        const copiedPages = await newPdf.copyPages(pdfDoc, pageRange);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save(); // Save the PDF to a Uint8Array

        // Define the output path using sanitized metadata/filename and part number
        // Place split files in a subdirectory to avoid reprocessing them in the next run
        const outputDir = uploadsDir;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        const outputFileName = `${sanitizedMetadata}_part_${part}.pdf`;
        const outputPath = path.join(outputDir, outputFileName);

        // Write the PDF bytes to the file system
        fs.writeFileSync(outputPath, newPdfBytes);
        console.log(`  Saved part ${part}: ${outputFileName}`);
        part++;
      }
      console.log(`Finished processing ${pdfFileName}. Total parts: ${part - 1}`);

    } catch (error) {
      console.error(`Error processing file ${pdfFileName}:`, error);
      // Continue to the next file if one fails
    }
  }
}
