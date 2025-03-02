import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import './Quiz.css';

interface QuizItem {
  id: string;
  sentence: string;
  definition: string;
  imageUrl?: string;
  box: number;
  nextReview: Date;
}

const Quiz: React.FC = () => {
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({
    remembered: 0,
    forgotten: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchQuizItems = async () => {
      if (!currentUser) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const sentencesRef = collection(db, 'sentences');
        const now = new Date();
        const quizQuery = query(
          sentencesRef, 
          where('userId', '==', currentUser.uid),
          where('nextReview', '<=', now)
        );
        
        const querySnapshot = await getDocs(quizQuery);
        const fetchedQuizItems: QuizItem[] = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          nextReview: docSnap.data().nextReview.toDate(),
        } as QuizItem));

        setQuizItems(fetchedQuizItems);
        setStats(prev => ({ ...prev, total: fetchedQuizItems.length }));
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching quiz items:', err);
        setError('Failed to fetch quiz items');
        setIsLoading(false);
      }
    };

    fetchQuizItems();
  }, [currentUser]);

  const currentItem = quizItems[currentItemIndex];

  const handleShowDefinition = () => {
    setShowDefinition(true);
  };

  const handleShowImage = () => {
    setShowImage(true);
  };

  const updateSentenceBox = async (remembered: boolean) => {
    if (!currentItem) return;

    try {
      const sentenceRef = doc(db, 'sentences', currentItem.id);
      const now = new Date();
      const nextReviewDate = new Date();

      let newBox = currentItem.box;
      if (remembered) {
        // Increase box level if remembered
        newBox = Math.min(newBox + 1, 7);
        // Increase time between reviews exponentially
        nextReviewDate.setDate(now.getDate() + Math.pow(2, newBox));
      } else {
        // Reset box to 1 if forgotten
        newBox = 1;
        // Short delay before next review
        nextReviewDate.setDate(now.getDate() + 1);
      }

      await updateDoc(sentenceRef, {
        box: newBox,
        lastReviewed: Timestamp.fromDate(now),
        nextReview: Timestamp.fromDate(nextReviewDate)
      });
    } catch (err) {
      console.error('Error updating sentence:', err);
    }
  };

  const handleRemembered = async () => {
    await updateSentenceBox(true);
    setStats(prev => ({
      ...prev,
      remembered: prev.remembered + 1,
    }));
    moveToNextItem();
  };

  const handleForgotten = async () => {
    await updateSentenceBox(false);
    setStats(prev => ({
      ...prev,
      forgotten: prev.forgotten + 1,
    }));
    moveToNextItem();
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

  if (isLoading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

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
