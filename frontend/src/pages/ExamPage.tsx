import React, { useState, useEffect, useRef } from 'react';
import styles from './ExamPage.module.css';
import { Link } from 'react-router-dom'; // Add this for navigation
// import { MathJaxContext, MathJax } from 'better-react-mathjax';
// import ImageUploader from '../components/ImageUploader';


// Define interfaces for the question types
interface MCQ {
  question: string;
  options: string[];
  answer: string;
  type: 'MCQ'; // Add type discriminator
}

interface QA {
  question: string;
  answer: string;
  type: 'QA'; // Add type discriminator
}

type Question = MCQ | QA;

// Define interface for user answers
interface UserAnswers {
   [key: number]: string; // Store selected option for MCQ or text for QA
 }

// Define interface for QA check results
// interface QAResult {
//     Correct: boolean;
//     Judgement: string;
// }
// const config = {
//   loader: { load: ['[tex]/html', '[tex]/ams', '[tex]/color', '[tex]/cancel', '[tex]/noundefined', '[tex]/configmacros', '[tex]/newcommand'] },
//   tex: {
//     packages: {'[+]': ['html', 'ams', 'color', 'cancel', 'noundefined', 'configmacros', 'newcommand']},
//     inlineMath: [['$', '$'], ['\\(', '\\)']],
//     displayMath: [['$$', '$$'], ['\\[', '\\]']],
//     processEscapes: true,
//     processEnvironments: true,
//     tags: 'ams'
//   },
//   options: {
//     skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
//     processHtmlClass: 'tex2jax_process',
//     ignoreHtmlClass: 'tex2jax_ignore'
//   },
//   chtml: {
//     displayAlign: 'left',               // keeps display math left‑aligned in preview
//     linebreaks: {
//       automatic: true,                  // let MathJax insert soft breaks
//       width: 'container'                // use the preview box's width
//     }
//   }
// };

// interface QAResults {
//     [key: number]: QAResult | null; // Store result or null if not checked yet
// }

const MAX_MCQ_SCORE = 2;
// const MAX_QA_SCORE = 6;

const ExamPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  // const [qaResults, setQaResults] = useState<QAResults>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [checkingAnswer, setCheckingAnswer] = useState<boolean>(false); // For QA check loading
  const [mcqChecked, setMcqChecked] = useState<{ [key: number]: boolean }>({}); // Track which MCQs have been checked
  const [score, setScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [isExamFinished, setIsExamFinished] = useState<boolean>(false);

  const navigationPanelRef = useRef<HTMLDivElement>(null);
  // const [qaInputValue, setQaInputValue] = useState<string>('');
  // const [selectedImageFiles, setSelectedImageFiles] = useState<{ [key: number]: File[] }>({});
  // const [uploadResetKey, setUploadResetKey] = useState<number>(0); // Used to reset ImageUploader after submission
  
  // Function to insert math symbols into the textarea
  // const insertMathSymbol = (symbol: string) => {
  //   const textarea = document.querySelector('.'+styles.mathInput) as HTMLTextAreaElement;
  //   if (!textarea) return;
    
  //   // Get cursor position
  //   const start = textarea.selectionStart;
  //   const end = textarea.selectionEnd;
    
  //   // Insert the symbol at cursor position
  //   const newValue = qaInputValue.substring(0, start) + symbol + qaInputValue.substring(end);
  //   setQaInputValue(newValue);
  //   setUserAnswers({
  //     ...userAnswers,
  //     [currentQuestionIndex]: newValue
  //   });
    
  //   // Focus the textarea and set cursor position after insertion
  //   setTimeout(() => {
  //     textarea.focus();
  //     // Position cursor after the inserted symbol if it's a simple symbol,
  //     // or inside brackets if it's a complex structure
  //     let newCursorPos = start + symbol.length;
  //     if (symbol.includes('{}')) {
  //       newCursorPos = start + symbol.indexOf('{}') + 1;
  //     } else if (symbol.includes(' a ')) {
  //       // For matrices, position cursor at the first element
  //       newCursorPos = start + symbol.indexOf('a');
  //     }
  //     textarea.setSelectionRange(newCursorPos, newCursorPos);
  //   }, 0);
  // };
 

  // --- Refactored Question Fetching ---
  const fetchQuestionsAndSetup = async () => {
    setLoading(true);
    setError(null);
    // Reset states before fetching new questions
    setUserAnswers({});
    // setQaResults({});
    setMcqChecked({});
    setScore(0);
    setMaxScore(0);
    setIsExamFinished(false);
    setCurrentQuestionIndex(0);
    // setSelectedImageFiles({});
    // setUploadResetKey(prev => prev + 1);

    try {
        const response = await fetch('http://localhost:3001/questions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched questions:", data.questions);

        // Add type discriminators and combine questions
        const combinedQuestions: Question[] = [
          ...data.questions.map((mcq: Omit<MCQ, 'type'>) => ({ ...mcq, type: 'MCQ' as const })),
          // ...data.selectedQAs.map((qa: Omit<QA, 'type'>) => ({ ...qa, type: 'QA' as const })),
        ];

        // Ensure exactly 35 questions if possible, pad if necessary (or truncate)
        // For now, let's assume the backend provides 50 + 2 = 35
        if (combinedQuestions.length !== 60) {
            console.warn(`Expected 60 questions, but received ${combinedQuestions.length}. Adjusting UI elements accordingly.`);
            // Potentially adjust side panel logic if needed based on actual length
        }


        setQuestions(combinedQuestions);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndSetup(); // Call the setup function on mount
  }, []); // Run only on initial mount

  useEffect(() => {
    if (questions.length === 0) {
      setIsExamFinished(false);
      return;
    }
    const questionsNotCompleted = questions.filter((q, index) => {
      if (q.type === 'MCQ') {
        return !mcqChecked[index];
       } 
       // else if (q.type === 'QA') {
      //   return !qaResults[index];
      // }
      return false;
    });
    if (questionsNotCompleted.length === 0) {
      setIsExamFinished(true);
    } else {
      setIsExamFinished(false);
    }
  }, [/*qaResults,*/ mcqChecked, questions]);


  // Effect to sync input value with user answers when changing questions
  // useEffect(() => {
  //   const currentQuestion = questions[currentQuestionIndex];
  //   if (currentQuestion?.type === 'QA') {
  //     setQaInputValue(userAnswers[currentQuestionIndex] || '');
  //   }
  // }, [currentQuestionIndex, questions, userAnswers]);

  // --- Scoring Logic ---

  useEffect(() => {
    if (isExamFinished) {
      calculateScore();
      if (navigationPanelRef.current) {
        navigationPanelRef.current.scrollTo({
          top: navigationPanelRef.current.scrollHeight,
          behavior: 'smooth',
        });
    }
    }
  }, [isExamFinished]);
  
  const calculateScore = () => {
    let currentScore = 0;
    let currentMaxScore = 0;

    questions.forEach((q, index) => {
      if (q.type === 'MCQ') {
        currentMaxScore += MAX_MCQ_SCORE;
        if (mcqChecked[index] && userAnswers[index] === q.answer) {
          currentScore += MAX_MCQ_SCORE;
        }
      } 
      /* else if (q.type === 'QA') {
        currentMaxScore += MAX_QA_SCORE;
        if (qaResults[index]?.Correct) {
          currentScore += MAX_QA_SCORE;
        }
      } */
    });

    setScore(currentScore);
    setMaxScore(currentMaxScore);
  };

  // --- Reset Logic ---
  const handleReset = () => {
    // Simply call the fetch function again, which also resets state
    fetchQuestionsAndSetup();
  };

  const handleNavigationClick = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleMcqChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent changing after checking
    if (mcqChecked[currentQuestionIndex]) return;
    setUserAnswers({
      ...userAnswers,
      [currentQuestionIndex]: event.target.value,
    });
  };

  // Handle checking an MCQ answer
  const checkMcqAnswer = (index: number) => {
    const ans = userAnswers[index];
    if (!ans) return;
    setMcqChecked(prev => ({ ...prev, [index]: true }));
  };

  // Update the image files for the current question
  // const handleImageFilesSelected = (files: File[]) => {
  //   setSelectedImageFiles({
  //     ...selectedImageFiles,
  //     [currentQuestionIndex]: files
  //   });
  // };

  // Helper function to determine navigation button class
  const getNavButtonClass = (index: number): string => {
    const question = questions[index];
    const isAnswered = !!userAnswers[index];
    const isActive = index === currentQuestionIndex;
    let correctnessClass = '';

    if (question?.type === 'MCQ' && mcqChecked[index]) {
      correctnessClass = userAnswers[index] === question.answer ? styles.correctAnswer : styles.incorrectAnswer;
    } //else if (question?.type === 'QA' && qaResults[index]) {
    //   correctnessClass = qaResults[index]?.Correct ? styles.correctAnswer : styles.incorrectAnswer;
    // }

    // Build the class string
    const classes = [styles.navButton];
    if (isActive) classes.push(styles.active);

    // Apply correctness class if evaluated, otherwise apply answered class if answered
    if (correctnessClass) {
        classes.push(correctnessClass);
    } else if (isAnswered) {
        classes.push(styles.answered);
    }


    return classes.join(' ');
  };

  // Check QA answer with files
  // const checkQaAnswer = async (index: number) => {
  //   const question = questions[index];
  //   const userAnswer = userAnswers[index];
  //   const imageFiles = selectedImageFiles[index] || [];

  //   if (!question || question.type !== 'QA' || !(userAnswer || imageFiles.length > 0)) {
  //     console.warn("Cannot check QA answer: Invalid state.", { index, question, userAnswer });
  //     return;
  //   }

  //   setCheckingAnswer(true);
  //   setQaResults({ ...qaResults, [index]: null }); // Clear previous result for this question

  //   try {
  //     // Create a FormData object to send the text answer and images
  //     const formData = new FormData();
  //     formData.append('question', question.question);
  //     formData.append('userAnswer', userAnswer);
  //     formData.append('correctAnswer', question.answer);
      
  //     // Add all image files
  //     imageFiles.forEach(file => {
  //       formData.append('images', file);
  //     });

  //     // Send the formData with fetch
  //     const response = await fetch('http://localhost:3001/check-answer', {
  //       method: 'POST',
  //       body: formData
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const result: QAResult = await response.json();
  //     setQaResults({ ...qaResults, [index]: result });
      
  //     // Reset images after successful submission
  //     setUploadResetKey(prev => prev + 1);

  //   } catch (err) {
  //     console.error("Failed to check QA answer:", err);
  //     // Optionally show an error message to the user for this specific check
  //     setQaResults({ 
  //       ...qaResults, 
  //       [index]: { 
  //         Correct: false, 
  //         Judgement: `Error checking answer: ${err instanceof Error ? err.message : 'Unknown error'}` 
  //       } 
  //     });
  //   } finally {
  //     setCheckingAnswer(false);
  //   }
  // };


  if (loading) {
    return <div className={styles.container}>Loading questions...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error loading questions: {error}</div>;
  }

  if (questions.length === 0) {
      return <div className={styles.container}>No questions available.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userAnswers[currentQuestionIndex] || '';
  // const currentQAResult = qaResults[currentQuestionIndex];
  // const currentImages = selectedImageFiles[currentQuestionIndex] || [];

  return (
    <div className={styles.examContainer}>
      <div className={styles.navigationPanel}
        ref={navigationPanelRef}>
        <h2>Exam Navigation</h2>
        <div className={styles.navGrid}>
          {questions.map((_, index) => (
            <button
              key={index}
              className={getNavButtonClass(index)} // Use the helper function
              onClick={() => handleNavigationClick(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Add Score and Reset Buttons */}
        <div className={styles.examControls}>
          <button
            onClick={handleReset}
            className={styles.resetButton}
          >
            Reset Exam
          </button>
        </div>

        {/* Display Score */}
        {isExamFinished && (
          <div className={styles.scoreDisplay}>
            <h3>Exam Finished!</h3>
            <p>Your Score: {score} / {maxScore}</p>
          </div>
        )}
      </div>


      <div className={styles.questionPanel}>
        <div className={styles.questionHeader}>
          <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <Link to="/course" className={styles.backLink}>Back to Course</Link>
        </div>
     
        <p className={styles.questionText}>
       
         {currentQuestion.question}
      
          </p>
      
        {currentQuestion.type === 'MCQ' && (
          <div className={styles.optionsContainer}>
            {currentQuestion.options.map((option, idx) => (
              <div 
                key={idx} 
                className={`${styles.option} ${currentAnswer === option && styles.selected}`}
                onClick={() => {
                  if (!mcqChecked[currentQuestionIndex]) {
                    setUserAnswers({
                      ...userAnswers,
                      [currentQuestionIndex]: option
                    });
                  }
                }}
              >
                <div className={styles.optionLetter}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <div className={styles.optionText}>
                  {option}
                </div>
                <input
                  type="radio"
                  id={`q${currentQuestionIndex}_opt${idx}`}
                  name={`q${currentQuestionIndex}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={handleMcqChange}
                  style={{ display: 'none' }} /* Hide the actual radio button */
                />
              </div>
            ))}
            {/* Check button for MCQ */}
            {currentAnswer && !mcqChecked[currentQuestionIndex] && (
              <button
                className={styles.checkButton}
                onClick={() => checkMcqAnswer(currentQuestionIndex)}
              >
                Check Answer
              </button>
            )}
            {/* MCQ feedback after checking */}
            {mcqChecked[currentQuestionIndex] && (
              <div className={`${styles.feedback} ${currentAnswer === currentQuestion.answer ? styles.correct : styles.incorrect}`}>
                <p>
                  <strong>Your answer:</strong> {currentAnswer}{' '}
                  {currentAnswer === currentQuestion.answer ? (
                    <span className={styles.correct}>✓ Correct!</span>
                  ) : (
                    <span className={styles.incorrect}>✗ Incorrect</span>
                  )}
                </p>
                {currentAnswer !== currentQuestion.answer && (
                  <p><strong>Correct answer:</strong> {currentQuestion.answer}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* {currentQuestion.type === 'QA' && (
          <div className={styles.qaContainer}>
            <div className={styles.mathToolbar}>
              
              <button onClick={() => insertMathSymbol('\\frac{a}{b}')} title="Fraction">
                ⅟
              </button>
              <button onClick={() => insertMathSymbol('\\sqrt{}')} title="Square Root">
                √
              </button>
              <button onClick={() => insertMathSymbol('x^{}')} title="Exponential">
                x^y
              </button>
              <button onClick={() => insertMathSymbol('\\text{x}_y')} title="subscript">
                x_y
              </button>
              <button onClick={() => insertMathSymbol('\\ln{}')} title="Natural Log">
                ln
              </button>
              <button onClick={() => insertMathSymbol('\\int_{a}^{b}')} title="Integral">
                ∫
              </button>
              <button onClick={() => insertMathSymbol('\\sum_{i=1}^{n}')} title="Summation">
                ∑
              </button>
              <button onClick={() => insertMathSymbol('\\lambda')} title="Lambda">
                λ
              </button>
              
             
              <button onClick={() => insertMathSymbol('\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}')} title="2x2 Matrix">
                [ ]
              </button>
              <button onClick={() => insertMathSymbol('\\frac{d}{dx}')} title="Derivative">
                d/dx
              </button>
             
          
            </div>

            <textarea
              className={styles.mathInput}
              value={qaInputValue}
              disabled={(currentQAResult !== null && currentQAResult !== undefined)}
              onChange={(e) => {
                setQaInputValue(e.target.value);
                setUserAnswers({
                  ...userAnswers,
                  [currentQuestionIndex]: e.target.value
                });
                
              }}
              placeholder="Type or insert LaTeX math expressions here..."
              rows={5}
            />

            <div className={styles.mathPreview}>
              <h4>Preview:</h4>
              <MathJaxContext config={config}>
                <MathJax>
                { qaInputValue
        ? '\\(' + qaInputValue + '\\)'   // inline style → will wrap and break lines
        : 'Your math will appear here…' }
                </MathJax>
              </MathJaxContext>
            </div>

           
            <div className={styles.imageUploaderSection}>
              <h4>Add Images to Your Answer</h4>
              <div className={styles.imageUploaderDescription}>
                <p>You can upload JPEG or PNG images to include with your answer. These might be diagrams, sketches, or other visual elements.</p>
              </div>
              <ImageUploader 
                selectedFiles={currentImages}
                onFilesSelected={handleImageFilesSelected}
                resetKey={uploadResetKey}
              />
            </div>

            <button
              onClick={() => checkQaAnswer(currentQuestionIndex)}
              disabled={(!qaInputValue && currentImages.length === 0) || checkingAnswer || (currentQAResult !== null && currentQAResult !== undefined)}
              className={styles.checkButton}
            >
              {checkingAnswer ? 'Checking...' : 'Check Answer'}
            </button>

            {currentQAResult && (
              <div className={`${styles.feedback} ${currentQAResult.Correct ? styles.correct : styles.incorrect}`}>
                <p><strong>Evaluation:</strong> {currentQAResult.Correct ? 'Correct' : 'Incorrect'}</p>
                <p><strong>Judgement:</strong> {currentQAResult.Judgement}</p>
                <p><strong>Correct Answer:</strong> 
                  <MathJaxContext config={config}>
                    <MathJax>
                      {currentQuestion.answer}
                    </MathJax>
                  </MathJaxContext>
                </p>
              </div>
            )}
          </div>
        )} */}

        <div className={styles.pagination}>
             <button
               onClick={() => handleNavigationClick(currentQuestionIndex - 1)}
               disabled={currentQuestionIndex === 0}
             >
               ← Previous
             </button>
             <button
               onClick={() => handleNavigationClick(currentQuestionIndex + 1)}
               disabled={currentQuestionIndex === questions.length - 1}
             >
               Next →
             </button>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
