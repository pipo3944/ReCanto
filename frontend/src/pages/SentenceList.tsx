import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SentenceList.css';

// Mock data for demonstration
const mockSentences = [
  {
    id: 1,
    sentence: 'Serendipity',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way',
    imageUrl: 'https://via.placeholder.com/150',
    box: 2,
    lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
  },
  {
    id: 2,
    sentence: 'Ephemeral',
    definition: 'Lasting for a very short time',
    imageUrl: 'https://via.placeholder.com/150',
    box: 3,
    lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
  },
  {
    id: 3,
    sentence: 'Ubiquitous',
    definition: 'Present, appearing, or found everywhere',
    imageUrl: 'https://via.placeholder.com/150',
    box: 1,
    lastReviewed: null,
    nextReview: new Date(), // Today
  },
  {
    id: 4,
    sentence: 'Mellifluous',
    definition: 'Pleasant to hear; sweet-sounding',
    imageUrl: 'https://via.placeholder.com/150',
    box: 4,
    lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
  },
  {
    id: 5,
    sentence: 'Quintessential',
    definition: 'Representing the most perfect example of a quality or class',
    imageUrl: 'https://via.placeholder.com/150',
    box: 5,
    lastReviewed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
    nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 days from now
  },
];

const SentenceList: React.FC = () => {
  const [sentences, setSentences] = useState(mockSentences);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBox, setFilterBox] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('nextReview');

  // In a real app, you would fetch this data from your API
  useEffect(() => {
    // Example API call:
    // const fetchSentences = async () => {
    //   try {
    //     const token = localStorage.getItem('token');
    //     const response = await fetch('/api/sentences', {
    //       headers: {
    //         'Authorization': `Bearer ${token}`
    //       }
    //     });
    //     const data = await response.json();
    //     setSentences(data);
    //   } catch (error) {
    //     console.error('Error fetching sentences:', error);
    //   }
    // };
    // fetchSentences();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterBox(value === '' ? null : parseInt(value));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const filteredSentences = sentences
    .filter(sentence => 
      sentence.sentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sentence.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(sentence => filterBox === null || sentence.box === filterBox)
    .sort((a, b) => {
      if (sortBy === 'sentence') {
        return a.sentence.localeCompare(b.sentence);
      } else if (sortBy === 'box') {
        return a.box - b.box;
      } else if (sortBy === 'lastReviewed') {
        if (!a.lastReviewed) return 1;
        if (!b.lastReviewed) return -1;
        return b.lastReviewed.getTime() - a.lastReviewed.getTime();
      } else { // nextReview
        return a.nextReview.getTime() - b.nextReview.getTime();
      }
    });

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString();
  };

  const handleDelete = (id: number) => {
    // In a real app, you would call your API to delete the sentence
    // For demo purposes, we'll just update the state
    setSentences(sentences.filter(sentence => sentence.id !== id));
  };

  return (
    <div className="sentence-list-page">
      <div className="sentence-list-header">
        <h1 className="page-title">My Sentences</h1>
        <Link to="/sentences/new" className="btn-primary">Add New Sentence</Link>
      </div>

      <div className="sentence-list-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search sentences..."
            value={searchTerm}
            onChange={handleSearch}
            className="form-control"
          />
        </div>

        <div className="filter-options">
          <div className="filter-group">
            <label htmlFor="boxFilter">Box:</label>
            <select
              id="boxFilter"
              value={filterBox === null ? '' : filterBox.toString()}
              onChange={handleFilterChange}
              className="form-control"
            >
              <option value="">All</option>
              <option value="1">Box 1</option>
              <option value="2">Box 2</option>
              <option value="3">Box 3</option>
              <option value="4">Box 4</option>
              <option value="5">Box 5</option>
              <option value="6">Box 6</option>
              <option value="7">Box 7</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortBy">Sort by:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              className="form-control"
            >
              <option value="nextReview">Next Review Date</option>
              <option value="lastReviewed">Last Reviewed</option>
              <option value="sentence">Alphabetical</option>
              <option value="box">Box</option>
            </select>
          </div>
        </div>
      </div>

      {filteredSentences.length > 0 ? (
        <div className="sentence-cards">
          {filteredSentences.map(sentence => (
            <div key={sentence.id} className="sentence-card">
              <div className="sentence-card-header">
                <h2 className="sentence-text">{sentence.sentence}</h2>
                <span className={`box-badge box-${sentence.box}`}>Box {sentence.box}</span>
              </div>
              
              <div className="sentence-card-body">
                <p className="sentence-definition">{sentence.definition}</p>
                
                {sentence.imageUrl && (
                  <div className="sentence-image">
                    <img src={sentence.imageUrl} alt={sentence.sentence} />
                  </div>
                )}
                
                <div className="sentence-dates">
                  <div className="date-item">
                    <span className="date-label">Last reviewed:</span>
                    <span className="date-value">{formatDate(sentence.lastReviewed)}</span>
                  </div>
                  <div className="date-item">
                    <span className="date-label">Next review:</span>
                    <span className="date-value">{formatDate(sentence.nextReview)}</span>
                  </div>
                </div>
              </div>
              
              <div className="sentence-card-actions">
                <Link to={`/sentences/edit/${sentence.id}`} className="btn-secondary">Edit</Link>
                <button 
                  onClick={() => handleDelete(sentence.id)} 
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No sentences found. Add your first sentence to start learning!</p>
          <Link to="/sentences/new" className="btn-primary">Add New Sentence</Link>
        </div>
      )}
    </div>
  );
};

export default SentenceList;
