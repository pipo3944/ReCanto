import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

interface QuizItem {
  id: string;
  sentence: string;
  dueDate: Date;
  box: number;
}

interface RecentItem {
  id: string;
  sentence: string;
  definition: string;
  lastReviewed: Date;
  box: number;
}

const Dashboard: React.FC = () => {
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [stats, setStats] = useState({
    totalSentences: 0,
    completedSentences: 0,
    inProgressSentences: 0,
    todayReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const sentencesRef = collection(db, 'sentences');

        // Fetch quiz items (sentences due for review)
        const now = new Date();
        const quizQuery = query(
          sentencesRef, 
          where('userId', '==', currentUser.uid),
          where('nextReview', '!=', null)
        );
        
        const quizSnapshot = await getDocs(quizQuery);
        const fetchedQuizItems: QuizItem[] = quizSnapshot.docs
          .filter(doc => {
            const nextReview = doc.data().nextReview?.toDate();
            return nextReview && nextReview <= now;
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            dueDate: doc.data().nextReview.toDate(),
          } as QuizItem));

        // Fetch recently reviewed items
        const recentQuery = query(
          sentencesRef, 
          where('userId', '==', currentUser.uid),
          where('lastReviewed', '!=', null),
          orderBy('lastReviewed', 'desc'),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentQuery);
        const fetchedRecentItems: RecentItem[] = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastReviewed: doc.data().lastReviewed.toDate(),
        } as RecentItem));

        // Calculate stats
        const totalSentencesQuery = query(
          sentencesRef, 
          where('userId', '==', currentUser.uid)
        );
        const totalSentencesSnapshot = await getDocs(totalSentencesQuery);
        const totalSentences = totalSentencesSnapshot.size;

        const completedSentences = fetchedRecentItems.filter(item => item.box >= 5).length;
        const inProgressSentences = totalSentences - completedSentences;
        const todayReviews = fetchedQuizItems.length;

        setQuizItems(fetchedQuizItems);
        setRecentItems(fetchedRecentItems);
        setStats({
          totalSentences,
          completedSentences,
          inProgressSentences,
          todayReviews,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Detailed error fetching dashboard data:', err);
        setError(`Failed to fetch dashboard data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const formatDate = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Sentences</h3>
          <p className="stat-value">{stats.totalSentences}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{stats.completedSentences}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-value">{stats.inProgressSentences}</p>
        </div>
        <div className="stat-card">
          <h3>Today's Reviews</h3>
          <p className="stat-value">{stats.todayReviews}</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Due for Review</h2>
            <Link to="/quiz" className="btn-primary">Start Quiz</Link>
          </div>
          
          {quizItems.length > 0 ? (
            <div className="quiz-items">
              {quizItems.map(item => (
                <div key={item.id} className="quiz-item-card">
                  <h3>{item.sentence}</h3>
                  <div className="quiz-item-details">
                    <span className="box-label">Box {item.box}</span>
                    <span className="due-time">Due: {formatDate(item.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No items due for review. Great job!</p>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recently Reviewed</h2>
            <Link to="/sentences" className="btn-secondary">View All</Link>
          </div>
          
          {recentItems.length > 0 ? (
            <div className="recent-items">
              {recentItems.map(item => (
                <div key={item.id} className="recent-item-card">
                  <h3>{item.sentence}</h3>
                  <p className="definition">{item.definition}</p>
                  <div className="recent-item-details">
                    <span className="box-label">Box {item.box}</span>
                    <span className="review-time">Last reviewed: {item.lastReviewed.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recently reviewed items.</p>
          )}
        </section>
      </div>

      <div className="dashboard-actions">
        <Link to="/sentences/new" className="btn-primary action-button">
          Add New Sentence
        </Link>
        <Link to="/stats" className="btn-secondary action-button">
          View Statistics
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
