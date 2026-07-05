import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvatarSrc } from '../utils/avatarMap';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <h3 className="logo">🐝 ChatHive</h3>
      <div className="navbar-right">
        {user && (
          <div className="navbar-user">
            <img
              src={getAvatarSrc(user.avatar)}
              alt={user.username}
              className="navbar-avatar"
            />
            <span>Hi, {user.username}</span>
          </div>
        )}
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;