import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './FriendSearch.css';

function FriendSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const { token } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await api.get(`/friends/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
      setMessage('');
    } catch (error) {
      console.log('Error searching:', error);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await api.post(
        `/friends/request/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Friend request sent!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error sending request');
    }
  };

  return (
    <div className="friend-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by username or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {message && <p className="search-message">{message}</p>}

      <div className="search-results">
        {results.map((u) => (
          <div key={u._id} className="search-result-item">
            <span>{u.username}</span>
            <button onClick={() => handleSendRequest(u._id)}>Add Friend</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendSearch;