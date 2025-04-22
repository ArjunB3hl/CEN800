import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navigation.module.css';

const Navigation: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);
  
  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [menuOpen]);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
    
        
        <button 
          className={styles.menuButton} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <ul className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
          {menuOpen && (
            <button 
              className={styles.closeButton} 
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          
          <li className={styles.navItem}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${isActiveLink('/') ? styles.active : ''}`}
            >
              Home
            </Link>
          </li>
          
          <li className={styles.navItem}>
            <Link 
              to="/lecture/ethics" 
              className={`${styles.navLink} ${isActiveLink('/lecture/ethics') ? styles.active : ''}`}
            >
              Engineering Ethics
            </Link>
          </li>
          
          <li className={styles.navItem}>
            <Link 
              to="/lecture/cs1" 
              className={`${styles.navLink} ${isActiveLink('/lecture/cs1') ? styles.active : ''}`}
            >
              Case Study 1
            </Link>
          </li>
          
          <li className={styles.navItem}>
            <Link 
              to="/lecture/cs2" 
              className={`${styles.navLink} ${isActiveLink('/lecture/cs2') ? styles.active : ''}`}
            >
              Case Study 2
            </Link>
          </li>
          
          <li className={styles.navItem}>
            <Link 
              to="/lecture/profession" 
              className={`${styles.navLink} ${isActiveLink('/lecture/profession') ? styles.active : ''}`}
            >
              Engineering Profession
            </Link>
          </li>
          
          <li className={styles.navItem}>
            <Link 
              to="/lecture/sustain" 
              className={`${styles.navLink} ${isActiveLink('/lecture/sustain') ? styles.active : ''}`}
            >
              Sustainability
            </Link>
          </li>
        </ul>
      </div>
      
      {menuOpen && (
        <div 
          className={`${styles.overlay} ${styles.overlayVisible}`} 
          onClick={closeMenu}
        />
      )}
    </nav>
  );
};

export default Navigation;
