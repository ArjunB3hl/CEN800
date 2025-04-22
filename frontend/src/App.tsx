
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
            <h1 className="title">CEN 800</h1>
            <p className="subtitle">Explore the essential principles of laws and ethics within the engineering profession. This course covers professional responsibilities, ethical decision-making, sustainability, and real-world case studies. All materials are provided to guide your understanding of the legal and ethical landscape of engineering.</p>
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
