import { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './FriendSearch.css';

function FriendSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { token } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await api.get(`/friends/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (error) {
      toast.error('Error searching users');
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await api.post(
        `/friends/request/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending request');
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