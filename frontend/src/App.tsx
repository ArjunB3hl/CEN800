
import { Link } from 'react-router-dom'; // Import Link
import './App.css';



function App() {
  
  

 
  return (
    <div className="App">
      {/* Add a background element for parallax/blur */}
      <div className="background-layer"></div> 
      
      {/* Main container */}
      <div className="main-container">
       
        
        <div className="right-panel">
            <>
            <h1 className="title">ELE 888</h1>
             <p className="subtitle">Dive into the exciting world of machine learning and AI! In this course, you'll explore neural networks, pattern recognition, and clustering algorithms through engaging lectures and hands-on projects. No textbook needed—all materials are provided to help you build your own intelligent systems from the ground up!</p>
             {/* Add links to course content and exam pages */}
             <div className="button-container"> {/* Added container for buttons */}
               <Link to="/course" className="course-link-button">Go to Course Content</Link>
               <Link to="/exam" className="course-link-button">Go to Exam</Link> {/* Added Exam link */}
             </div>
           </>
         
        
        
        
        </div> {/* End right-panel */}
      </div> {/* End main-container */}
    </div>
  );
}

export default App;
