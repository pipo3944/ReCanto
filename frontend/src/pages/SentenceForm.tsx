import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  getDocs 
} from 'firebase/firestore';
import { db, useEmulator, firebaseUtils } from '../config/firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import './SentenceForm.css';

interface SentenceFormData {
  sentence: string;
  definition: string;
  imageUrl: string;
  userId: string;
  box: number;
  lastReviewed: Date | null;
  nextReview: Date | null;
}

const SentenceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState<SentenceFormData>({
    sentence: '',
    definition: '',
    imageUrl: '',
    userId: '',
    box: 1,
    lastReviewed: null,
    nextReview: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    const checkAndCreateInitialSentences = async () => {
      if (!currentUser) return;

      try {
        console.group('🌱 Initial Sentences Check');
        console.log('User ID:', currentUser.uid);
        console.log('Emulator Mode:', useEmulator);
        console.log('Emulator Connected:', firebaseUtils.isEmulatorConnected());

        const sentencesRef = collection(db, 'sentences');
        const sentencesSnapshot = await getDocs(sentencesRef);

        console.log('Total Existing Sentences:', sentencesSnapshot.size);

        if (sentencesSnapshot.empty) {
          // Create initial sentences if none exist
          const initialSentences = [
            {
              sentence: 'Serendipity',
              definition: 'The occurrence and development of events by chance in a happy or beneficial way',
              imageUrl: 'https://via.placeholder.com/150',
              userId: currentUser.uid,
              box: 1,
              lastReviewed: null,
              nextReview: new Date(),
            },
            {
              sentence: 'Ephemeral',
              definition: 'Lasting for a very short time',
              imageUrl: 'https://via.placeholder.com/150',
              userId: currentUser.uid,
              box: 1,
              lastReviewed: null,
              nextReview: new Date(),
            }
          ];

          for (const sentence of initialSentences) {
            const docRef = await addDoc(sentencesRef, {
              ...sentence,
              nextReview: Timestamp.fromDate(sentence.nextReview),
              lastReviewed: null
            });
            console.log('📝 Created Initial Sentence:', docRef.id);
          }

          console.log('✅ Initial sentences created successfully');
        }

        console.groupEnd();
      } catch (err) {
        console.group('❌ Initial Sentences Error');
        console.error('Detailed Error:', err);
        
        // Attempt to reconnect emulator if connection failed
        if (!firebaseUtils.isEmulatorConnected()) {
          console.log('🔄 Attempting to reconnect emulator');
          firebaseUtils.retryEmulatorConnection();
        }
        
        console.groupEnd();
      }
    };

    checkAndCreateInitialSentences();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setError('You must be logged in to add or edit sentences');
      return;
    }

    setFormData(prevData => ({
      ...prevData,
      userId: currentUser.uid,
    }));

    if (isEditMode) {
      const fetchSentence = async () => {
        try {
          const sentenceRef = doc(db, 'sentences', id);
          const sentenceSnap = await getDoc(sentenceRef);

          if (sentenceSnap.exists()) {
            const sentenceData = sentenceSnap.data();
            setFormData({
              sentence: sentenceData.sentence,
              definition: sentenceData.definition,
              imageUrl: sentenceData.imageUrl || '',
              userId: sentenceData.userId,
              box: sentenceData.box || 1,
              lastReviewed: sentenceData.lastReviewed ? sentenceData.lastReviewed.toDate() : null,
              nextReview: sentenceData.nextReview ? sentenceData.nextReview.toDate() : null,
            });
            setImagePreview(sentenceData.imageUrl || '');
          } else {
            setError('Sentence not found');
          }
        } catch (err) {
          console.error('Error fetching sentence:', err);
          setError('Failed to fetch sentence details');
        }
      };

      fetchSentence();
    }
  }, [id, isEditMode, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      imageUrl: value,
    });
    setImagePreview(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.group('📝 Sentence Submission');
    console.log('Edit Mode:', isEditMode);
    console.log('User ID:', currentUser?.uid);
    console.log('Emulator Mode:', useEmulator);
    console.log('Emulator Connected:', firebaseUtils.isEmulatorConnected());

    try {
      // Validate input data
      if (!formData.sentence || !formData.definition) {
        throw new Error('Sentence and definition are required');
      }

      // Validate user authentication
      if (!currentUser?.uid) {
        throw new Error('User must be authenticated to create or edit sentences');
      }

      // Prepare data for Firestore
      const sentenceData = {
        ...formData,
        userId: currentUser.uid, // Explicitly set userId
        lastReviewed: formData.lastReviewed ? Timestamp.fromDate(formData.lastReviewed) : null,
        nextReview: formData.nextReview ? Timestamp.fromDate(formData.nextReview) : null,
      };

      // Additional logging for debugging
      console.log('Sentence Data with Explicit UserID:', {
        ...sentenceData,
        userId: '***' // Mask the actual user ID for privacy
      });

      console.log('Sentence Data:', sentenceData);

      if (isEditMode) {
        // Update existing sentence
        const sentenceRef = doc(db, 'sentences', id);
        
        // Additional validation for edit mode
        const existingDoc = await getDoc(sentenceRef);
        if (!existingDoc.exists()) {
          throw new Error('Sentence not found');
        }

        // Verify user ownership in edit mode
        const existingData = existingDoc.data();
        if (existingData?.userId !== currentUser?.uid) {
          throw new Error('Not authorized to edit this sentence');
        }

        await updateDoc(sentenceRef, sentenceData);
        console.log('✅ Sentence updated successfully');
        setSuccess('Sentence updated successfully!');
      } else {
        // Add new sentence
        const sentencesRef = collection(db, 'sentences');
        const docRef = await addDoc(sentencesRef, sentenceData);
        console.log('✅ Sentence added successfully:', docRef.id);
        setSuccess('Sentence added successfully!');
      }

      console.groupEnd();

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/sentences');
      }, 1500);
    } catch (err) {
      console.group('❌ Sentence Submission Error');
      console.error('Detailed Error:', err);
      
      // Detailed error handling
      if (err instanceof Error) {
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);
        
        // Set user-friendly error message
        setError(err.message || 'Failed to save sentence. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      // Attempt to reconnect emulator if connection failed
      if (!firebaseUtils.isEmulatorConnected()) {
        console.log('🔄 Attempting to reconnect emulator');
        firebaseUtils.retryEmulatorConnection();
      }
      
      console.groupEnd();
      
      setLoading(false);
    }
  };

  return (
    <div className="sentence-form-page">
      <div className="sentence-form-header">
        <h1 className="page-title">{isEditMode ? 'Edit Sentence' : 'Add New Sentence'}</h1>
        <Link to="/sentences" className="btn-secondary">Back to Sentences</Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="sentence-form-container">
        <form onSubmit={handleSubmit} className="sentence-form">
          <div className="form-group">
            <label htmlFor="sentence">Sentence or Word</label>
            <input
              type="text"
              id="sentence"
              name="sentence"
              value={formData.sentence}
              onChange={handleInputChange}
              className="form-control"
              required
              placeholder="Enter a word or sentence to learn"
            />
          </div>

          <div className="form-group">
            <label htmlFor="definition">Definition (English)</label>
            <textarea
              id="definition"
              name="definition"
              value={formData.definition}
              onChange={handleInputChange}
              className="form-control"
              required
              placeholder="Enter the English definition"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleImageUrlChange}
              className="form-control"
              placeholder="Enter an image URL (optional)"
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Sentence' : 'Add Sentence'}
            </button>
            <Link to="/sentences" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SentenceForm;
