import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import './App.css';

interface FileWithPreview extends File {
  preview?: string;
}

// Define the MCQ interface to match the backend response
interface MultipleChoice {
  question: string;
  options: string[];
  answer: string;
}

// Define app modes
type AppMode = 'upload' | 'quiz';
type QuizType = 'mcq' | 'qa';

// Define the Q&A interface to match the backend response
interface QuestionAnswer {
  question: string;
  answer: string;
}

// Define the answer judgment interface
interface AnswerJudgment {
  Correct: boolean;
  Judgement: string;
}

function App() {
  // App mode state
  const [appMode, setAppMode] = useState<AppMode>('upload');
  const [quizType, setQuizType] = useState<QuizType>('mcq');
  
  // File upload related state
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // MCQ related state
  const [mcqQuestions, setMcqQuestions] = useState<MultipleChoice[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number, total: number }>({ correct: 0, total: 0 });
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  
  // Q&A related state
  const [qaQuestions, setQaQuestions] = useState<QuestionAnswer[]>([]);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [answerJudgment, setAnswerJudgment] = useState<AnswerJudgment | null>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState<boolean>(false);

  // Handle file selection from input
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files) as FileWithPreview[];
      
      // Add preview URLs for image files
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          file.preview = URL.createObjectURL(file);
        }
      });
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      console.log('Files selected:', newFiles.map(f => f.name).join(', '));
    }
  };

  // Handle drag and drop events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files) as FileWithPreview[];
      
      // Add preview URLs for image files
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          file.preview = URL.createObjectURL(file);
        }
      });
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      console.log('Files dropped:', newFiles.map(f => f.name).join(', '));
    }
  };

  // Remove a file from the selection
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL if it exists to prevent memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus('Please select at least one file first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing to upload...');

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file); // 'files' must match the name expected by multer on the backend
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 300);

      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      
      // Clean up preview URLs
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      // Process MCQ data if available
      if (data.mcqData && Array.isArray(data.mcqData) && data.mcqData.length > 0) {
        setMcqQuestions(data.mcqData);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowAnswer(false);
        setScore({ correct: 0, total: 0 });
        setQuizCompleted(false);
      }
      
      // Process Q&A data if available
      if (data.questionAnswerData && Array.isArray(data.questionAnswerData) && data.questionAnswerData.length > 0) {
        setQaQuestions(data.questionAnswerData);
        resetQaState();
      }
      
      // Determine if we should switch modes
      if ((data.mcqData && data.mcqData.length > 0) || 
          (data.questionAnswerData && data.questionAnswerData.length > 0)) {
        setUploadStatus(`Questions generated successfully from your files.`);
        setAppMode('quiz');
        
        // Default to MCQ if available, otherwise Q&A
        if (data.mcqData && data.mcqData.length > 0) {
          setQuizType('mcq');
        } else if (data.questionAnswerData && data.questionAnswerData.length > 0) {
          setQuizType('qa');
        }
      } else {
        setUploadStatus(`Upload successful: ${data.files.length} file(s) uploaded! No questions could be generated.`);
      }
      
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload error: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle selecting an answer in the quiz
  const handleOptionSelect = (option: string) => {
    if (!showAnswer) {
      setSelectedOption(option);
    }
  };

  // Check if the selected answer is correct
  const checkAnswer = () => {
    if (selectedOption === null) return;
    
    const currentQuestion = mcqQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.answer;
    
    setShowAnswer(true);
    setScore(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));
  };

  // Move to the next question
  const nextQuestion = () => {
    if (currentQuestionIndex < mcqQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
    }
  };

  // Reset the quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setQuizCompleted(false);
  };
  
  // Reset Q&A state
  const resetQaState = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setAnswerJudgment(null);
  };

  // Submit user answer for evaluation
  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    setIsCheckingAnswer(true);
    
    try {
      const currentQuestion = qaQuestions[currentQuestionIndex];
      const response = await fetch('http://localhost:3001/check-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          userAnswer: userAnswer,
          correctAnswer: currentQuestion.answer
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const judgment = await response.json();
      setAnswerJudgment(judgment);
      
      // Update score
      if (judgment.Correct) {
        setScore(prev => ({
          correct: prev.correct + 1,
          total: prev.total + 1
        }));
      } else {
        setScore(prev => ({
          ...prev,
          total: prev.total + 1
        }));
      }
      
    } catch (error) {
      console.error('Error checking answer:', error);
    } finally {
      setIsCheckingAnswer(false);
    }
  };
  
  // Move to next Q&A question
  const nextQaQuestion = () => {
    if (currentQuestionIndex < qaQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setAnswerJudgment(null);
    } else {
      setQuizCompleted(true);
    }
  };
  
  // Toggle between MCQ and Q&A modes
  const toggleQuizType = () => {
    // Reset state for the new quiz type
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    
    if (quizType === 'mcq') {
      setQuizType('qa');
      resetQaState();
    } else {
      setQuizType('mcq');
      setSelectedOption(null);
      setShowAnswer(false);
      setScore({ correct: 0, total: 0 });
    }
  };

  // Return to upload mode for new files
  const returnToUpload = () => {
    setMcqQuestions([]);
    setQaQuestions([]);
    setAppMode('upload');
    setUploadStatus('');
  };

  return (
    <div className="App">
      <header className="App-header">
        {appMode === 'upload' && (
          <>
            <h1 className="title">Quiz Generator</h1>
            <p className="subtitle">Upload study materials to create interactive quizzes</p>
            
            {/* Drag and drop area */}
            <div 
              className={`drop-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <div className="drop-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p>Drop files here or click to browse</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                multiple 
                style={{ display: 'none' }}
              />
            </div>
            
            {/* File list */}
            {selectedFiles.length > 0 && (
              <div className="file-list">
                <h3>Selected Files ({selectedFiles.length})</h3>
                <ul>
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="file-item">
                      <div className="file-info">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="file-preview" />
                        ) : (
                          <div className="file-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </div>
                        )}
                        <div className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <button 
                        className="remove-file" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        disabled={isUploading}
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Upload button and progress */}
            <div className="upload-controls">
              <button 
                className="upload-button" 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
              
              {isUploading && (
                <div className="progress-container">
                  <div className="circular-progress">
                    <svg viewBox="0 0 100 100">
                      <circle className="bg" cx="50" cy="50" r="45"></circle>
                      <circle 
                        className="progress" 
                        cx="50" 
                        cy="50" 
                        r="45"
                        style={{ '--progress-percent': uploadProgress } as React.CSSProperties}
                      ></circle>
                    </svg>
                    <div className="progress-text">
                      <span className="progress-value">{Math.round(uploadProgress)}%</span>
                      Generating Quiz
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Status message */}
            {uploadStatus && (
              <div className={`status-message ${uploadStatus.includes('error') ? 'error' : ''}`}>
                {uploadStatus}
              </div>
            )}
          </>
        )}
        
        {appMode === 'quiz' && (
          <>
            <h1 className="title">Interactive Quiz</h1>
            
            {/* Quiz Type Toggle */}
            <div className="quiz-type-toggle">
              <button 
                className={`toggle-button ${quizType === 'mcq' ? 'active' : ''}`}
                onClick={() => quizType !== 'mcq' && toggleQuizType()}
                disabled={mcqQuestions.length === 0}
              >
                Multiple Choice
              </button>
              <button 
                className={`toggle-button ${quizType === 'qa' ? 'active' : ''}`}
                onClick={() => quizType !== 'qa' && toggleQuizType()}
                disabled={qaQuestions.length === 0}
              >
                Short Answer
              </button>
            </div>
            
            {/* MCQ Quiz Section */}
            {quizType === 'mcq' && !quizCompleted && mcqQuestions.length > 0 && (
              <div className="quiz-container">
                <div className="question-card">
                  <div className="question-number">
                    Question {currentQuestionIndex + 1} of {mcqQuestions.length}
                  </div>
                  <div className="question-text">
                    {mcqQuestions[currentQuestionIndex].question}
                  </div>
                  <div className="options-list">
                    {mcqQuestions[currentQuestionIndex].options.map((option, index) => (
                      <div 
                        key={index} 
                        className={`option ${selectedOption === option ? 'selected' : ''} 
                                  ${showAnswer ? 
                                    (option === mcqQuestions[currentQuestionIndex].answer ? 'correct' : 
                                    selectedOption === option ? 'incorrect' : '') : ''}`}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>
                  <div className="quiz-controls">
                    {!showAnswer ? (
                      <button 
                        className="check-answer-button" 
                        onClick={checkAnswer}
                        disabled={selectedOption === null}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button 
                        className="next-question-button" 
                        onClick={nextQuestion}
                      >
                        {currentQuestionIndex < mcqQuestions.length - 1 ? 'Next Question' : 'View Results'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Q&A Quiz Section */}
            {quizType === 'qa' && !quizCompleted && qaQuestions.length > 0 && (
              <div className="quiz-container">
                <div className="question-card qa-card">
                  <div className="question-number">
                    Question {currentQuestionIndex + 1} of {qaQuestions.length}
                  </div>
                  <div className="question-text">
                    {qaQuestions[currentQuestionIndex].question}
                  </div>
                  
                  <div className="answer-input-container">
                    <textarea
                      className="answer-input"
                      placeholder="Type your answer here..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={answerJudgment !== null}
                    />
                  </div>
                  
                  {answerJudgment && (
                    <div className={`judgment-container ${answerJudgment.Correct ? 'correct' : 'incorrect'}`}>
                      <div className="judgment-header">
                        {answerJudgment.Correct ? 'Correct!' : 'Incorrect'}
                      </div>
                      <div className="judgment-text">
                        {answerJudgment.Judgement}
                      </div>
                      <div className="correct-answer">
                        <strong>Correct answer:</strong> {qaQuestions[currentQuestionIndex].answer}
                      </div>
                    </div>
                  )}
                  
                  <div className="quiz-controls">
                    {!answerJudgment ? (
                      <button 
                        className="check-answer-button" 
                        onClick={submitAnswer}
                        disabled={userAnswer.trim() === '' || isCheckingAnswer}
                      >
                        {isCheckingAnswer ? 'Checking...' : 'Submit Answer'}
                      </button>
                    ) : (
                      <button 
                        className="next-question-button" 
                        onClick={nextQaQuestion}
                      >
                        {currentQuestionIndex < qaQuestions.length - 1 ? 'Next Question' : 'View Results'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Quiz Results */}
            {quizCompleted && (
              <div className="quiz-results">
                <h2>Quiz Completed!</h2>
                <div className="score-display">
                  <div className="score-text">
                    You scored <span className="score-number">{score.correct}</span> out of <span className="score-total">{score.total}</span>
                  </div>
                  <div className="score-percentage">
                    {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                  </div>
                </div>
                <div className="quiz-result-buttons">
                  <button className="reset-quiz-button" onClick={quizType === 'mcq' ? resetQuiz : resetQaState}>
                    Restart Quiz
                  </button>
                  {mcqQuestions.length > 0 && qaQuestions.length > 0 && (
                    <button className="toggle-quiz-type-button" onClick={toggleQuizType}>
                      Try {quizType === 'mcq' ? 'Short Answer' : 'Multiple Choice'} Questions
                    </button>
                  )}
                  <button className="new-files-button" onClick={returnToUpload}>
                    Upload New Files
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </header>
    </div>
  );
}

export default App;
