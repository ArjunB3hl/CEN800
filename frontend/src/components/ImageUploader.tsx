// import React, { useRef, useEffect } from 'react';
// import styles from './ImageUploader.module.css';

// interface ImageUploaderProps {
//   selectedFiles: File[];
//   onFilesSelected: (files: File[]) => void;
//   resetKey?: number; // Optional key to reset the component
// }

// const ImageUploader: React.FC<ImageUploaderProps> = ({ selectedFiles, onFilesSelected, resetKey }) => {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // Reset selected images when resetKey changes
//   useEffect(() => {
//     if (resetKey !== undefined) {
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//     }
//   }, [resetKey]);

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files) {
//       const newFiles = Array.from(event.target.files);
//       onFilesSelected([...selectedFiles, ...newFiles]);
      
//       // Reset the file input to allow selecting the same file again
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//     }
//   };

//   const removeSelectedImage = (index: number) => {
//     const updatedFiles = selectedFiles.filter((_, i) => i !== index);
//     onFilesSelected(updatedFiles);
//   };

//   const clearAllImages = () => {
//     onFilesSelected([]);
//   };

//   return (
//     <div className={styles.imageUploader}>
//       <div className={styles.uploadControls}>
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept="image/jpeg,image/png"
//           multiple
//           onChange={handleFileChange}
//           className={styles.fileInput}
//           id="image-upload"
//         />
//         <label htmlFor="image-upload" className={styles.uploadButton}>
//           Select Images
//         </label>
//         {selectedFiles.length > 0 && (
//           <button
//             onClick={clearAllImages}
//             className={styles.clearButton}
//           >
//             Clear All
//           </button>
//         )}
//       </div>

//       {selectedFiles.length > 0 && (
//         <div className={styles.imageSection}>
//           <h4>Selected Images ({selectedFiles.length})</h4>
//           <div className={styles.imageGrid}>
//             {selectedFiles.map((file, index) => (
//               <div key={`selected-${index}`} className={styles.imageItem}>
//                 <div className={styles.imagePreview}>
//                   <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} />
//                 </div>
//                 <div className={styles.imageInfo}>
//                   <span className={styles.imageName}>{file.name}</span>
//                   <button
//                     className={styles.removeButton}
//                     onClick={() => removeSelectedImage(index)}
//                     title="Remove"
//                   >
//                     ×
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ImageUploader;
