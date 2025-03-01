import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Quiz.css';

// Mock data for demonstration
const mockQuizItems = [
  {
    id: 1,
    sentence: 'Serendipity',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way',
    imageUrl: 'https://via.placeholder.com/150',
    box: 2,
  },
  {
    id: 2,
    sentence: 'Ephemeral',
    definition: 'Lasting for a very short time',
    imageUrl: 'https://via.placeholder.com/150',
    box: 3,
  },
  {
    id: 3,
    sentence: 'Ubiquitous',
    definition: 'Present, appearing, or found everywhere',
    imageUrl: 'https://via.placeholder.com/150',
    box: 1,
  },
];

const Quiz: React.FC = () => {
  const [quizItems, setQuizItems] = useState(mockQuizItems);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({
    remembered: 0,
    forgotten: 0,
    total: mockQuizItems.length,
  });

  // In a real app, you would fetch this data from your API
  useEffect(() => {
    // Example API call:
    // const fetchQuizItems = async () => {
    //   try {
    //     const token = localStorage.getItem('token');
    //     const response = await fetch('/api/quiz/due', {
    //       headers: {
    //         'Authorization': `Bearer ${token}`
    //       }
    //     });
    //     const data = await response.json();
    //     setQuizItems(data);
    //     setStats(prev => ({ ...prev, total: data.length }));
    //   } catch (error) {
    //     console.error('Error fetching quiz items:', error);
    //   }
    // };
    // fetchQuizItems();
  }, []);

  const currentItem = quizItems[currentItemIndex];

  const handleShowDefinition = () => {
    setShowDefinition(true);
  };

  const handleShowImage = () => {
    setShowImage(true);
  };

  const handleRemembered = async () => {
    // In a real app, you would update the item's status in your API
    // For demo purposes, we'll just update the local state
    setStats(prev => ({
      ...prev,
      remembered: prev.remembered + 1,
    }));

    // Move to the next item or complete the quiz
    moveToNextItem();

    // Example of how the actual API call would look:
    /*
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/sentences/${currentItem.id}/remembered`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error updating sentence status:', error);
    }
    */
  };

  const handleForgotten = async () => {
    // In a real app, you would update the item's status in your API
    // For demo purposes, we'll just update the local state
    setStats(prev => ({
      ...prev,
      forgotten: prev.forgotten + 1,
    }));

    // Move to the next item or complete the quiz
    moveToNextItem();

    // Example of how the actual API call would look:
    /*
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/sentences/${currentItem.id}/forgotten`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error updating sentence status:', error);
    }
    */
  };

  const moveToNextItem = () => {
    if (currentItemIndex < quizItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setShowDefinition(false);
      setShowImage(false);
    } else {
      setCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentItemIndex(0);
    setShowDefinition(false);
    setShowImage(false);
    setCompleted(false);
    setStats({
      remembered: 0,
      forgotten: 0,
      total: quizItems.length,
    });
  };

  if (quizItems.length === 0) {
    return (
      <div className="quiz-page">
        <h1 className="page-title">Quiz</h1>
        <div className="empty-state">
          <p>No items due for review. Great job!</p>
          <Link to="/" className="btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="quiz-page">
        <h1 className="page-title">Quiz Completed!</h1>
        <div className="quiz-completed">
          <div className="quiz-stats">
            <div className="stat-item">
              <h3>Total</h3>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-item">
              <h3>Remembered</h3>
              <p className="stat-value remembered">{stats.remembered}</p>
            </div>
            <div className="stat-item">
              <h3>Forgotten</h3>
              <p className="stat-value forgotten">{stats.forgotten}</p>
            </div>
          </div>
          
          <div className="quiz-actions">
            <button onClick={resetQuiz} className="btn-primary">Start Again</button>
            <Link to="/" className="btn-secondary">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <h1 className="page-title">Quiz</h1>
        <div className="quiz-progress">
          <span className="progress-text">
            {currentItemIndex + 1} of {quizItems.length}
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentItemIndex + 1) / quizItems.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="quiz-card">
        <div className="quiz-card-content">
          <h2 className="quiz-sentence">{currentItem.sentence}</h2>
          
          {showDefinition ? (
            <div className="quiz-definition">
              <h3>Definition:</h3>
              <p>{currentItem.definition}</p>
            </div>
          ) : (
            <button onClick={handleShowDefinition} className="btn-secondary hint-button">
              Show Definition
            </button>
          )}
          
          {currentItem.imageUrl && (
            showImage ? (
              <div className="quiz-image">
                <img src={currentItem.imageUrl} alt={currentItem.sentence} />
              </div>
            ) : (
              <button onClick={handleShowImage} className="btn-secondary hint-button">
                Show Image
              </button>
            )
          )}
        </div>
        
        <div className="quiz-card-actions">
          <button onClick={handleForgotten} className="btn-danger">
            I don't remember
          </button>
          <button onClick={handleRemembered} className="btn-success">
            I remember
          </button>
        </div>
        
        <div className="quiz-box-info">
          <span className={`box-badge box-${currentItem.box}`}>Box {currentItem.box}</span>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
