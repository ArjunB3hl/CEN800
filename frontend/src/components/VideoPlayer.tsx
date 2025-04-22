import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import styles from './VideoPlayer.module.css';
import LoadingSpinner from './LoadingSpinner';

interface VideoPlayerProps {
  videos: string[];
  bucketName?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videos, 
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const playerRef = useRef<ReactPlayer>(null);

  // Ensure videos array and index are valid before accessing
  const currentVideo = videos && videos.length > currentVideoIndex ? videos[currentVideoIndex] : null;
  
  // For this implementation, we're using URLs directly from the backend
  // The API returns an array of video names, not complete URLs
  const videoUrl = currentVideo || '';

  console.log('Current video URL:', videoUrl);

  useEffect(() => {
    // Reset player state when video changes
    setProgress(0);
    setDuration(0);
    setPlaybackRate(1.0);
    setPlayerError(null);
  }, [currentVideoIndex, videos]);

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handleProgress = (state: { 
    played: number; 
    playedSeconds: number; 
    loaded: number; 
    loadedSeconds: number 
  }) => {
    setProgress(state.played * 100);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handlePlaybackRateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaybackRate(parseFloat(event.target.value));
  };

  const handleBuffer = () => {
    setIsBuffering(true);
  };

  const handleBufferEnd = () => {
    setIsBuffering(false);
  };

  const handleError = (error: any) => {
    console.error('ReactPlayer Error:', error);
    setPlayerError(`Failed to load video. Please try again later.`);
  };

  // Auto play next video when current video ends
  const handleEnded = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get filename without path
  const getVideoFileName = (path: string) => {
    return path.split('/').pop()?.replace('.mp4', '') || path;
  };

  return (
    <div className={styles.videoPlayerContainer}>
      <div className={styles.videoWrapper}>
        {videos.length > 0 && !playerError ? (
          <>
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              width="100%"
              height="100%"
              controls={true}
              playbackRate={playbackRate}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onEnded={handleEnded}
              onBuffer={handleBuffer}
              onBufferEnd={handleBufferEnd}
              onError={handleError}
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                    disablePictureInPicture: true,
                  },
                },
              }}
            />
            {isBuffering && (
              <div className={styles.loadingContainer}>
                <LoadingSpinner size="medium" message="Buffering video..." />
              </div>
            )}
          </>
        ) : playerError ? (
          <div className={styles.noVideos}>
            <div className={styles.noVideosIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Error Loading Video</h3>
            <p>{playerError}</p>
          </div>
        ) : (
          <div className={styles.noVideos}>
            {videos.length === 0 ? (
              <>
                <div className={styles.noVideosIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 12L10.5 9V15L15.5 12Z" fill="currentColor"/>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>No Videos Available</h3>
                <p>There are no videos available for this lecture.</p>
              </>
            ) : (
              <>
                <LoadingSpinner size="medium" message="Loading video..." />
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.controlsBar}>
        <div className={styles.navigationControls}>
          <button 
            className={styles.controlButton}
            onClick={handlePrevious} 
            disabled={currentVideoIndex === 0 || !videos || videos.length === 0}
            aria-label="Previous video"
          >
            <span className={styles.controlButtonIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            Previous
          </button>
          <button 
            className={styles.controlButton}
            onClick={handleNext} 
            disabled={!videos || currentVideoIndex >= videos.length - 1}
            aria-label="Next video"
          >
            Next
            <span className={styles.controlButtonIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
        <div className={styles.playbackControls}>
          <label htmlFor="playbackRate" className={styles.playbackLabel}>Speed:</label>
          <select
            id="playbackRate"
            className={styles.playbackSelect}
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            disabled={!currentVideo}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>
      </div>

      {currentVideo && (
        <div className={styles.videoInfo}>
          <div>
            <span className={styles.videoIndex}>Video {currentVideoIndex + 1} of {videos.length}</span>
            {' '}&middot;{' '}
            <span className={styles.videoTitle}>{getVideoFileName(currentVideo)}</span>
          </div>
          {duration > 0 && (
            <div className={styles.videoDuration}>
              <span className={styles.videoDurationIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {formatTime(duration)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
