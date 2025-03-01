import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './SentenceForm.css';

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
];

interface SentenceFormData {
  sentence: string;
  definition: string;
  imageUrl: string;
}

const SentenceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<SentenceFormData>({
    sentence: '',
    definition: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [suggestedDefinition, setSuggestedDefinition] = useState<string>('');
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode) {
      // In a real app, you would fetch the sentence data from your API
      // For demo purposes, we'll use the mock data
      const sentence = mockSentences.find(s => s.id === parseInt(id as string));
      if (sentence) {
        setFormData({
          sentence: sentence.sentence,
          definition: sentence.definition,
          imageUrl: sentence.imageUrl,
        });
        setImagePreview(sentence.imageUrl);
      } else {
        setError('Sentence not found');
      }
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // If the sentence field is changed and has at least 3 characters, simulate fetching definition suggestions
    if (name === 'sentence' && value.length >= 3) {
      // Simulate API call delay
      setTimeout(() => {
        // This would be replaced with actual API calls in a real application
        const mockDefinition = `Example definition for "${value}" (In a real app, this would be fetched from Oxford Dictionary API)`;
        setSuggestedDefinition(mockDefinition);
        
        // Mock suggested images
        setSuggestedImages([
          'https://via.placeholder.com/150?text=Image1',
          'https://via.placeholder.com/150?text=Image2',
          'https://via.placeholder.com/150?text=Image3',
        ]);
      }, 500);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      imageUrl: value,
    });
    setImagePreview(value);
  };

  const handleSuggestedDefinitionClick = () => {
    setFormData({
      ...formData,
      definition: suggestedDefinition,
    });
  };

  const handleSuggestedImageClick = (imageUrl: string) => {
    setFormData({
      ...formData,
      imageUrl: imageUrl,
    });
    setImagePreview(imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // In a real app, you would send the data to your API
      // For demo purposes, we'll simulate a successful submission
      setTimeout(() => {
        setLoading(false);
        setSuccess(isEditMode ? 'Sentence updated successfully!' : 'Sentence added successfully!');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/sentences');
        }, 1500);
      }, 1000);

      // Example of how the actual API call would look:
      /*
      const token = localStorage.getItem('token');
      const url = isEditMode ? `/api/sentences/${id}` : '/api/sentences';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save sentence');
      }

      setSuccess(isEditMode ? 'Sentence updated successfully!' : 'Sentence added successfully!');
      setTimeout(() => {
        navigate('/sentences');
      }, 1500);
      */
    } catch (err) {
      setError('Failed to save sentence. Please try again.');
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
            {suggestedDefinition && (
              <div className="suggestion-box">
                <p>Suggested definition:</p>
                <div className="suggestion-content">
                  {suggestedDefinition}
                </div>
                <button 
                  type="button" 
                  className="btn-secondary suggestion-button"
                  onClick={handleSuggestedDefinitionClick}
                >
                  Use this definition
                </button>
              </div>
            )}
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

          {suggestedImages.length > 0 && (
            <div className="suggestion-box">
              <p>Suggested images:</p>
              <div className="suggested-images">
                {suggestedImages.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className="suggested-image"
                    onClick={() => handleSuggestedImageClick(imageUrl)}
                  >
                    <img src={imageUrl} alt={`Suggestion ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

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
