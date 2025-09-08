import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import LoadingSpinner from './LoadingSpinner';

// For debugging
const debugEmailVerification = true;

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setStatus('verifying');
        
        if (debugEmailVerification) {
          console.log('VerifyEmail: Attempting to verify email with token:', token);
        }
        
        // Use the API service instead of direct fetch
        const data = await api.verifyEmail(token);
        
        if (debugEmailVerification) {
          console.log('VerifyEmail: Verification response data:', data);
        }
        
        if (data.success) {
          setStatus('success');
          setMessage(data.message || data.alert || 'Email verified successfully!');
          setUser(data.user);
          
          // Countdown timer for redirect
          let countdown = 5;
          const countdownTimer = setInterval(() => {
            countdown -= 1;
            const countdownElement = document.querySelector('.countdown');
            if (countdownElement) {
              countdownElement.textContent = countdown.toString();
            }
            
            if (countdown <= 0) {
              clearInterval(countdownTimer);
              navigate('/login', { 
                state: { 
                  verificationSuccess: true, 
                  message: 'Your email has been successfully verified! Your account is now awaiting administrator approval before you can log in.' 
                }
              });
            }
          }, 1000);
          
          return () => clearInterval(countdownTimer);
        } else {
          setStatus('error');
          setMessage(data.message || data.alert || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Invalid or expired verification link');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {status === 'verifying' && (
          <div className="verify-email-loading">
            <LoadingSpinner />
            <h2>Verifying your email...</h2>
            <p>Please wait while we process your request</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-email-success">
            <div className="success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            {user && (
              <div className="user-info">
                <p>Thank you, {user.firstName} {user.lastName}!</p>
                <p>Your email address <strong>{user.email}</strong> has been verified.</p>
              </div>
            )}
            <div className="verification-next-steps">
              <h3>Next Steps</h3>
              <p><strong>IMPORTANT:</strong> Your email has been verified, but you cannot log in yet.</p>
              <p>Your account is now awaiting approval by an administrator. This process usually takes 1-2 business days.</p>
              <p>You will be notified by email once your account has been approved by an administrator.</p>
            </div>
            <div className="admin-verification-note">
              <div className="note-icon">⚠️</div>
              <div>
                <strong>Please Note:</strong> You will not be able to log in until an administrator has reviewed and approved your account.
              </div>
            </div>
            <div className="verify-email-actions">
              <div className="redirect-message">
                <p>Redirecting to login page in <span className="countdown">5</span> seconds...</p>
              </div>
              <button onClick={() => navigate('/login')} className="primary-btn">
                Go to Login Now
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-email-error">
            <div className="error-icon">!</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="verify-email-actions">
              <p>
                If your verification link has expired, you can request a new one:
              </p>
              <Link to="/resend-verification" className="secondary-btn">
                Resend Verification Email
              </Link>
              <Link to="/login" className="tertiary-btn">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .verify-email-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }
        
        .verify-email-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="150" fill="url(%23a)"/><circle cx="800" cy="300" r="100" fill="url(%23a)"/><circle cx="600" cy="700" r="120" fill="url(%23a)"/></svg>') center/cover;
          pointer-events: none;
        }
        
        .verify-email-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 32px 64px rgba(147, 51, 234, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 550px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .verify-email-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
        }
        
        .success-icon {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 20px;
          box-shadow: 0 10px 20px rgba(5, 150, 105, 0.3);
        }
        
        .error-icon {
          background: linear-gradient(135deg, #f87171, #dc2626);
          color: white;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 20px;
          box-shadow: 0 10px 20px rgba(220, 38, 38, 0.3);
        }
        
        .verify-email-success h2,
        .verify-email-error h2 {
          background: linear-gradient(135deg, #8a3ffc, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 1.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }
        
        .verify-email-error h2 {
          background: linear-gradient(135deg, #f87171, #dc2626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .user-info {
          background-color: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          text-align: left;
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .verification-next-steps {
          background: linear-gradient(to right, #f0f9ff, #e0f2fe);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          text-align: left;
          border: 1px solid rgba(14, 165, 233, 0.2);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .verification-next-steps h3 {
          margin-top: 0;
          color: #0284c7;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .verify-email-actions {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          display: block;
          text-align: center;
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
        
        .admin-verification-note {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background-color: #fff7ed;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin: 1rem 0;
          text-align: left;
          border: 1px solid rgba(234, 88, 12, 0.3);
          color: #9a3412;
        }
        
        .admin-verification-note .note-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .secondary-btn {
          background-color: white;
          color: #8a3ffc;
          border: 2px solid #8a3ffc;
          border-radius: 50px;
          padding: 0.9rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: block;
          text-align: center;
        }
        
        .secondary-btn:hover {
          background-color: rgba(138, 63, 252, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(138, 63, 252, 0.15);
        }
        
        .tertiary-btn {
          color: #6b7280;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 0.75rem;
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        
        .tertiary-btn:hover {
          color: #8a3ffc;
          background-color: rgba(138, 63, 252, 0.05);
        }
        
        .redirect-message {
          background-color: rgba(138, 63, 252, 0.1);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          border: 1px solid rgba(138, 63, 252, 0.2);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(138, 63, 252, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(138, 63, 252, 0); }
          100% { box-shadow: 0 0 0 0 rgba(138, 63, 252, 0); }
        }
        
        .redirect-message p {
          margin: 0;
          font-size: 1rem;
          color: #6b21a8;
          font-weight: 500;
        }
        
        .countdown {
          font-weight: bold;
          font-size: 1.25rem;
          color: #8a3ffc;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          border-radius: 50%;
          background-color: white;
          border: 2px solid #8a3ffc;
          box-shadow: 0 2px 8px rgba(138, 63, 252, 0.3);
          animation: countdown 1s infinite alternate;
        }
        
        @keyframes countdown {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
