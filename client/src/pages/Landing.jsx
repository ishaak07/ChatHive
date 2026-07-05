import { Link } from 'react-router-dom';
import chatIllustration from '../assets/chat-illustration.svg';
import './Landing.css';

function Landing() {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <h2 className="landing-logo">🐝 ChatHive</h2>
        <div className="landing-nav-links">
          <Link to="/login" className="nav-link-login">Login</Link>
          <Link to="/signup" className="nav-link-signup">Signup</Link>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="landing-text">
          <span className="badge">✨ Real-time messaging, reimagined</span>
          <h1>
            Connecting people <br /> using <span>ChatHive</span>
          </h1>
          <p>Join topic-based rooms, chat privately with friends, and stay connected — all in real time.</p>
          <div className="cta-group">
            <Link to="/signup" className="cta-button">
              Get Started Free
            </Link>
            <Link to="/login" className="cta-secondary">
              I have an account
            </Link>
          </div>
        </div>

        <div className="landing-illustration">
          <img src={chatIllustration} alt="Chat illustration" className="illustration-img" />
        </div>
      </div>

      <div className="landing-features">
        <div className="feature-card">
          <span className="feature-icon">💬</span>
          <h3>Group Rooms</h3>
          <p>Create or join topic-based chat rooms instantly.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔒</span>
          <h3>Private & Secure</h3>
          <p>Friend-request based system keeps your conversations private.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <h3>Real-time</h3>
          <p>Messages delivered instantly with live online status.</p>
        </div>
      </div>
    </div>
  );
}

export default Landing;