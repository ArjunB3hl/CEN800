import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import CourseContent from './CourseContent.tsx'; // Import CourseContent
import ExamPage from './pages/ExamPage.tsx'; // Import ExamPage
import LecturePage from './pages/LecturePage.tsx'; // Import LecturePage

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/course" element={<CourseContent />} />
        <Route path="/exam" element={<ExamPage />} />
        {/* Lecture routes for specific topics */}
        <Route path="/lecture/:lectureId" element={<LecturePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
