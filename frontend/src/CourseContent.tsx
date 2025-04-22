import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from './components/Navigation';
import './App.css';

interface LectureInfo {
  id: string;
  title: string;
  description: string;
}

const LECTURES: LectureInfo[] = [
  {
    id: 'ethics',
    title: 'Engineering Ethics',
    description: 'Explore ethical principles and dilemmas in the engineering profession.', // Added description
  },
  {
    id: 'cs1',
    title: 'Case Study 1',
    description: 'Analyze a real-world engineering case study (details to be added).', // Added description
  },
  {
    id: 'cs2',
    title: 'Case Study 2',
    description: 'Analyze another real-world engineering case study (details to be added).', // Added description
  },
  {
    id: 'profession',
    title: 'Engineering Profession',
    description: 'Understand the roles, responsibilities, and structure of the engineering profession.', // Added description
  },
  {
    id: 'sustain',
    title: 'Sustainability',
    description: 'Learn about sustainable practices and their importance in engineering.', // Added description
  }
];

const CourseContent: React.FC = () => {
  return (
    <div className="course-page">
      <Navigation />

      
      <main className="course-content">
        <div className="course-header">
          <h1>Laws and Ethics in Engineering</h1>
          <p className="course-intro">
          Welcome to the Laws and Ethics in Engineering course. Explore the lectures below to deepen your understanding of
          professional responsibilities, ethical considerations, and real-world case studies relevant to the engineering profession.
          </p>
          
          <div className="course-actions">
            <Link to="/exam" className="course-button">Take Exam</Link>
          </div>
        </div>
        
        <div className="lectures-list">
          {LECTURES.map(lecture => (
            <div className="lecture-card" key={lecture.id}>
              <h2 className="lecture-title">{lecture.title}</h2>
              <p className="lecture-description">{lecture.description}</p>
              <Link to={`/lecture/${lecture.id}`} className="lecture-link">
                View Lecture
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CourseContent;
