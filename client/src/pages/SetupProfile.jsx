import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './SetupProfile.css';

import avatar1 from '../assets/avatars/avatar1.svg';
import avatar2 from '../assets/avatars/avatar2.svg';
import avatar3 from '../assets/avatars/avatar3.svg';
import avatar4 from '../assets/avatars/avatar4.svg';
import avatar5 from '../assets/avatars/avatar5.svg';
import avatar6 from '../assets/avatars/avatar6.svg';
import avatar7 from '../assets/avatars/avatar7.svg';
import avatar8 from '../assets/avatars/avatar8.svg';
import avatar9 from '../assets/avatars/avatar9.svg';
import avatar10 from '../assets/avatars/avatar10.svg';
import avatar11 from '../assets/avatars/avatar11.svg';
import avatar12 from '../assets/avatars/avatar12.svg';
import avatar13 from '../assets/avatars/avatar13.svg';

const avatars = [
  { name: 'avatar1.svg', src: avatar1 },
  { name: 'avatar2.svg', src: avatar2 },
  { name: 'avatar3.svg', src: avatar3 },
  { name: 'avatar4.svg', src: avatar4 },
  { name: 'avatar5.svg', src: avatar5 },
  { name: 'avatar6.svg', src: avatar6 },
  { name: 'avatar7.svg', src: avatar7 },
  { name: 'avatar8.svg', src: avatar8 },
  { name: 'avatar9.svg', src: avatar9 },
  { name: 'avatar10.svg', src: avatar10 },
  { name: 'avatar11.svg', src: avatar11 },
  { name: 'avatar12.svg', src: avatar12 },
  { name: 'avatar13.svg', src: avatar13 },
];

function SetupProfile() {
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0].name);
  const [about, setAbout] = useState('Hey there! I am using ChatHive.');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['friendly', 'sweet']); // default tags
  const { token, user, login } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.put(
        '/auth/update-profile',
        { avatar: selectedAvatar, about, tags },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      login(
        { ...user, avatar: res.data.avatar, isProfileComplete: true },
        token
      );

      navigate('/chat');
    } catch (error) {
      console.log('Error updating profile:', error);
    }
  };

  return (
    <div className="setup-container">
      <form className="setup-form" onSubmit={handleSubmit}>
        <h2>Update details</h2>

        <p className="setup-label">Click to select an avatar</p>
        <div className="avatar-carousel-wrapper">
          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scrollCarousel('left')}
          >
            ←
          </button>

          <div className="avatar-carousel" ref={carouselRef}>
            {avatars.map((av) => (
              <img
                key={av.name}
                src={av.src}
                alt={av.name}
                className={`avatar-option ${selectedAvatar === av.name ? 'selected' : ''}`}
                onClick={() => setSelectedAvatar(av.name)}
              />
            ))}
          </div>

          <button
            type="button"
            className="carousel-arrow"
            onClick={() => scrollCarousel('right')}
          >
            →
          </button>
        </div>

        <p className="setup-label">About</p>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={3}
        />

        <p className="setup-label">Tags</p>
        <div className="tags-input-container">
          {tags.map((tag, index) => (
            <span key={index} className="tag-chip">
              {tag}
              <button type="button" onClick={() => removeTag(index)}>×</button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type and press Enter"
          />
        </div>

        <button type="submit" className="setup-submit">
          Update details
        </button>
      </form>
    </div>
  );
}

export default SetupProfile;