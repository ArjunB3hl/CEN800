import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import VideoPlayer from '../components/VideoPlayer';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './LecturePage.module.css';

// Define a mapping for lecture titles and their query parameters
const LECTURE_INFO = {
  'ethics': {
    title: 'Engineering Ethics',
    queryParam: 'EngineeringEthics'
  },
  'cs1': {
    title: 'Case Study 1',
    queryParam: 'CaseStudy1'
  },
  'cs2': {
    title: 'Case Study 2',
    queryParam: 'CaseStudy2'
  },
  'profession': {
    title: 'Engineering Profession',
    queryParam: 'EngineeringProfession'
  },
  'sustain': {
    title: 'Sustainability',
    queryParam: 'Sustainability'
  }
};

const LecturePage: React.FC = () => {
  const { lectureId } = useParams<{ lectureId: string }>();
  const [videos, setVideos] = useState<[string, string][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the lecture info based on the ID from the URL
  const lectureInfo = LECTURE_INFO[lectureId as keyof typeof LECTURE_INFO];
  
  useEffect(() => {
    const fetchVideos = async () => {
      if (!lectureInfo) {
        setError('Lecture not found');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:3001/videos?lecture=${lectureInfo.queryParam}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.videos || !data.videos.length) {
          setError('No videos available for this lecture');
        } else {
          setVideos(data.videos);
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVideos();
  }, [lectureId, lectureInfo]);

  // Extract the video URLs from the videos array - the second element contains the complete URL
  const videoUrls = videos.map(video => video[1]);

  return (
    <div className={styles.lecturePage}>
      <Navigation />
      
      <main className={styles.lectureContent}>
        <div className={styles.lectureHeader}>
          <h1 className={styles.lectureTitle}>
            {lectureInfo ? lectureInfo.title : 'Lecture Not Found'}
          </h1>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="large" message="Loading videos..." />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div className={styles.videoPlayerContainer}>
            <VideoPlayer videos={videoUrls} />
          </div>
        )}
      </main>
    </div>
  );
};

export default LecturePage;
