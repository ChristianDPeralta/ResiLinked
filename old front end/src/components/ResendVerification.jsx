import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import FormInput from './FormInput';
import LoadingSpinner from './LoadingSpinner';

const ResendVerification = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setStatus('loading');
      setError('');
      
      const response = await api.resendVerificationEmail(email);
      
      setStatus('success');
      setMessage(response.alert || 'Verification email sent successfully!');
    } catch (error) {
      setStatus('error');
      setError(
        error.response?.data?.alert || 
        error.response?.data?.message || 
        'Failed to send verification email'
      );
    }
  };

  return (
    <div className="resend-verification-container">
      <div className="resend-verification-card">
        <h2>Resend Verification Email</h2>
        
        {status === 'success' ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>{message}</p>
            <div className="resend-actions">
              <Link to="/login" className="primary-btn">
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p>Enter the email address you used during registration, and we'll send you a new verification link.</p>
            
            <form onSubmit={handleSubmit} className="resend-form">
              <FormInput
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={status === 'loading'}
              >
                {status === 'loading' ? <LoadingSpinner size="small" /> : 'Send Verification Email'}
              </button>
            </form>
            
            <div className="resend-footer">
              <Link to="/login" className="back-link">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .resend-verification-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem;
        }
        
        .resend-verification-card {
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 500px;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .resend-verification-card h2 {
          background: linear-gradient(135deg, #8a3ffc, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
        }
        
        .resend-verification-card > p {
          color: #4b5563;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .resend-form {
          margin-top: 1.5rem;
        }
        
        .error-message {
          background-color: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin: 15px 0;
          font-size: 0.95rem;
          border-left: 4px solid #dc2626;
          display: flex;
          align-items: center;
        }
        
        .error-message::before {
          content: '!';
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #dc2626;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-weight: bold;
          margin-right: 10px;
          flex-shrink: 0;
        }
        
        .primary-btn {
          background: linear-gradient(135deg, #8a3ffc, #6b21a8);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 1rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          display: block;
          text-align: center;
          margin-top: 2rem;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(138, 63, 252, 0.3);
        }
        
        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(138, 63, 252, 0.4);
        }
        
        .primary-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(138, 63, 252, 0.3);
        }
        
        .primary-btn:disabled {
          background: linear-gradient(135deg, #b794f6, #9d70e8);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .back-link {
          display: block;
          text-align: center;
          margin-top: 20px;
          color: #6b7280;
          text-decoration: none;
          transition: all 0.2s;
          font-size: 0.95rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }
        
        .back-link:hover {
          color: #8a3ffc;
          background-color: rgba(138, 63, 252, 0.05);
        }
        
        .resend-footer {
          margin-top: 2rem;
          text-align: center;
        }
        
        .success-message {
          text-align: center;
          animation: fadeIn 0.5s ease;
          padding: 1rem;
        }
        
        .success-icon {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }
        
        .success-message p {
          color: #374151;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        .resend-actions {
          margin-top: 2rem;
        }
        
        @media (max-width: 640px) {
          .resend-verification-container {
            padding: 1rem;
          }
          
          .resend-verification-card {
            padding: 2rem 1.5rem;
          }
          
          .resend-verification-card h2 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ResendVerification;
