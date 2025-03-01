import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

// Mock data for demonstration
const mockQuizItems = [
  {
    id: 1,
    sentence: 'Serendipity',
    dueDate: new Date(),
    box: 2,
  },
  {
    id: 2,
    sentence: 'Ephemeral',
    dueDate: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    box: 3,
  },
  {
    id: 3,
    sentence: 'Ubiquitous',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours from now
    box: 1,
  },
];

const mockRecentItems = [
  {
    id: 4,
    sentence: 'Mellifluous',
    definition: 'Pleasant to hear; sweet-sounding',
    lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    box: 4,
  },
  {
    id: 5,
    sentence: 'Quintessential',
    definition: 'Representing the most perfect example of a quality or class',
    lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    box: 5,
  },
];

const Dashboard: React.FC = () => {
  const [quizItems, setQuizItems] = useState(mockQuizItems);
  const [recentItems, setRecentItems] = useState(mockRecentItems);
  const [stats, setStats] = useState({
    totalSentences: 42,
    completedSentences: 15,
    inProgressSentences: 27,
    todayReviews: 5,
  });

  // In a real app, you would fetch this data from your API
  useEffect(() => {
    // Example API call:
    // const fetchDashboardData = async () => {
    //   try {
    //     const token = localStorage.getItem('token');
    //     const response = await fetch('/api/dashboard', {
    //       headers: {
    //         'Authorization': `Bearer ${token}`
    //       }
    //     });
    //     const data = await response.json();
    //     setQuizItems(data.quizItems);
    //     setRecentItems(data.recentItems);
    //     setStats(data.stats);
    //   } catch (error) {
    //     console.error('Error fetching dashboard data:', error);
    //   }
    // };
    // fetchDashboardData();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
