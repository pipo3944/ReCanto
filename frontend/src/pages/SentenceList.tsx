import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, useEmulator, firebaseUtils } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import './SentenceList.css';

interface Sentence {
  id: string;
  sentence: string;
  definition: string;
  imageUrl?: string;
  box: number;
  lastReviewed: Date | null;
  nextReview: Date | null;
}

const SentenceList: React.FC = () => {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBox, setFilterBox] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('nextReview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchSentences = async () => {
      if (!currentUser) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const sentencesRef = collection(db, 'sentences');
        
        // Enhanced diagnostic logging
        console.group('🔍 Sentence Fetch Diagnostics');
        console.log('User ID:', currentUser.uid);
        console.log('Firestore Database:', db);
        console.log('Emulator Mode:', useEmulator);
        console.log('Emulator Connected:', firebaseUtils.isEmulatorConnected());

        // Attempt to fetch all documents first to diagnose any potential issues
        const allDocsSnapshot = await getDocs(sentencesRef);
        console.log('Total Documents in Collection:', allDocsSnapshot.size);

        // Always use user-specific query for better security
        console.log('🌐 Using User-Specific Query Mode');
        const q = query(sentencesRef, where('userId', '==', currentUser.uid));

        const querySnapshot = await getDocs(q);
        console.log('Documents Matching Query:', querySnapshot.size);

        const fetchedSentences: Sentence[] = querySnapshot.docs
          .filter(docSnap => {
            const data = docSnap.data();
            const isValid = (
              // Always check for required fields
              data.sentence && 
              data.definition && 
              // In production or emulator, ensure userId matches
              (useEmulator || data.userId === currentUser.uid)
            );
            
            if (!isValid) {
              console.warn('🚨 Invalid Document Filtered:', docSnap.id, {
                hasValidSentence: !!data.sentence,
                hasValidDefinition: !!data.definition,
                userIdMatch: data.userId === currentUser.uid,
                emulatorMode: useEmulator
              });
            }
            
            return isValid;
          })
          .map(docSnap => {
            const data = docSnap.data();
            console.log('📄 Sentence Document:', docSnap.id, {
              ...data,
              userId: '***' // Mask user ID for privacy
            });
            
            return {
              id: docSnap.id,
              ...data,
              lastReviewed: data.lastReviewed ? data.lastReviewed.toDate() : null,
              nextReview: data.nextReview ? data.nextReview.toDate() : null
            } as Sentence;
          });

        console.log('✅ Fetched Sentences:', fetchedSentences.length);
        console.groupEnd();

        setSentences(fetchedSentences);
        setIsLoading(false);
      } catch (err) {
        console.group('❌ Sentence Fetch Error');
        console.error('Detailed Error:', err);
        
        if (err instanceof Error) {
          console.error('Error Name:', err.name);
          console.error('Error Message:', err.message);
          console.error('Error Stack:', err.stack);
        }
        
        // Attempt to reconnect emulator if connection failed
        if (!firebaseUtils.isEmulatorConnected()) {
          console.log('🔄 Attempting to reconnect emulator');
          firebaseUtils.retryEmulatorConnection();
        }
        
        console.groupEnd();
        
        setError(`Failed to fetch sentences: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    fetchSentences();
  }, [currentUser]);

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

  const handleDelete = async (id: string) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'sentences', id));
      
      // Remove from local state
      setSentences(sentences.filter(sentence => sentence.id !== id));
    } catch (err) {
      console.error('Error deleting sentence:', err);
      setError('Failed to delete sentence');
    }
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
        if (!a.nextReview) return 1;
        if (!b.nextReview) return -1;
        return a.nextReview.getTime() - b.nextReview.getTime();
      }
    });

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <div className="loading">Loading sentences...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

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
