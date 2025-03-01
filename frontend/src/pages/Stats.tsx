import React, { useState, useEffect } from 'react';
import './Stats.css';

// Mock data for demonstration
const mockBoxDistribution = [
  { box: 1, count: 5 },
  { box: 2, count: 8 },
  { box: 3, count: 12 },
  { box: 4, count: 7 },
  { box: 5, count: 4 },
  { box: 6, count: 3 },
  { box: 7, count: 3 },
];

const mockWeeklyActivity = [
  { date: '2023-02-20', remembered: 3, forgotten: 1 },
  { date: '2023-02-21', remembered: 5, forgotten: 2 },
  { date: '2023-02-22', remembered: 7, forgotten: 0 },
  { date: '2023-02-23', remembered: 4, forgotten: 3 },
  { date: '2023-02-24', remembered: 6, forgotten: 1 },
  { date: '2023-02-25', remembered: 2, forgotten: 0 },
  { date: '2023-02-26', remembered: 8, forgotten: 2 },
];

const mockUpcomingReviews = [
  { date: 'Today', count: 5 },
  { date: 'Tomorrow', count: 8 },
  { date: 'In 2 days', count: 3 },
  { date: 'In 3 days', count: 7 },
  { date: 'In 4 days', count: 2 },
  { date: 'In 5 days', count: 4 },
  { date: 'In 6 days', count: 6 },
];

const Stats: React.FC = () => {
  const [boxDistribution, setBoxDistribution] = useState(mockBoxDistribution);
  const [weeklyActivity, setWeeklyActivity] = useState(mockWeeklyActivity);
  const [upcomingReviews, setUpcomingReviews] = useState(mockUpcomingReviews);
  const [overallStats, setOverallStats] = useState({
    totalSentences: 42,
    completedSentences: 3,
    totalReviews: 156,
    successRate: 85,
    averageDaysToComplete: 45,
  });

  // In a real app, you would fetch this data from your API
  useEffect(() => {
    // Example API call:
    // const fetchStats = async () => {
    //   try {
    //     const token = localStorage.getItem('token');
    //     const response = await fetch('/api/stats', {
    //       headers: {
    //         'Authorization': `Bearer ${token}`
    //       }
    //     });
    //     const data = await response.json();
    //     setBoxDistribution(data.boxDistribution);
    //     setWeeklyActivity(data.weeklyActivity);
    //     setUpcomingReviews(data.upcomingReviews);
    //     setOverallStats(data.overallStats);
    //   } catch (error) {
    //     console.error('Error fetching stats:', error);
    //   }
    // };
    // fetchStats();
  }, []);

  // Calculate the maximum count for scaling the charts
  const maxBoxCount = Math.max(...boxDistribution.map(item => item.count));
  const maxActivityCount = Math.max(
    ...weeklyActivity.map(item => Math.max(item.remembered, item.forgotten))
  );
  const maxUpcomingCount = Math.max(...upcomingReviews.map(item => item.count));

  return (
    <div className="stats-page">
      <h1 className="page-title">Statistics</h1>

      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Sentences</h3>
          <p className="stat-value">{overallStats.totalSentences}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{overallStats.completedSentences}</p>
        </div>
        <div className="stat-card">
          <h3>Total Reviews</h3>
          <p className="stat-value">{overallStats.totalReviews}</p>
        </div>
        <div className="stat-card">
          <h3>Success Rate</h3>
          <p className="stat-value">{overallStats.successRate}%</p>
        </div>
        <div className="stat-card">
          <h3>Avg. Days to Complete</h3>
          <p className="stat-value">{overallStats.averageDaysToComplete}</p>
        </div>
      </div>

      <div className="stats-charts">
        <div className="stats-chart-container">
          <h2 className="chart-title">Box Distribution</h2>
          <div className="box-distribution-chart">
            {boxDistribution.map(item => (
              <div key={item.box} className="chart-bar-container">
                <div className="chart-label">Box {item.box}</div>
                <div className="chart-bar-wrapper">
                  <div 
                    className={`chart-bar box-${item.box}`} 
                    style={{ 
                      width: `${(item.count / maxBoxCount) * 100}%`,
                    }}
                  >
                    <span className="chart-value">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-chart-container">
          <h2 className="chart-title">Weekly Activity</h2>
          <div className="weekly-activity-chart">
            {weeklyActivity.map((item, index) => {
              const date = new Date(item.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const total = item.remembered + item.forgotten;
              const rememberedWidth = total > 0 
                ? (item.remembered / maxActivityCount) * 100 
                : 0;
              const forgottenWidth = total > 0 
                ? (item.forgotten / maxActivityCount) * 100 
                : 0;

              return (
                <div key={index} className="chart-bar-container">
                  <div className="chart-label">{dayName}</div>
                  <div className="chart-stacked-bar-wrapper">
                    <div className="chart-stacked-bar">
                      <div 
                        className="chart-bar-segment remembered" 
                        style={{ width: `${rememberedWidth}%` }}
                      >
                        {item.remembered > 0 && (
                          <span className="chart-value">{item.remembered}</span>
                        )}
                      </div>
                      <div 
                        className="chart-bar-segment forgotten" 
                        style={{ width: `${forgottenWidth}%` }}
                      >
                        {item.forgotten > 0 && (
                          <span className="chart-value">{item.forgotten}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color remembered"></div>
              <span>Remembered</span>
            </div>
            <div className="legend-item">
              <div className="legend-color forgotten"></div>
              <span>Forgotten</span>
            </div>
          </div>
        </div>

        <div className="stats-chart-container">
          <h2 className="chart-title">Upcoming Reviews</h2>
          <div className="upcoming-reviews-chart">
            {upcomingReviews.map((item, index) => (
              <div key={index} className="chart-bar-container">
                <div className="chart-label">{item.date}</div>
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar upcoming" 
                    style={{ 
                      width: `${(item.count / maxUpcomingCount) * 100}%`,
                    }}
                  >
                    <span className="chart-value">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
