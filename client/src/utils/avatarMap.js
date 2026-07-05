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

const avatarMap = {
  'avatar1.svg': avatar1,
  'avatar2.svg': avatar2,
  'avatar3.svg': avatar3,
  'avatar4.svg': avatar4,
  'avatar5.svg': avatar5,
  'avatar6.svg': avatar6,
  'avatar7.svg': avatar7,
  'avatar8.svg': avatar8,
  'avatar9.svg': avatar9,
  'avatar10.svg': avatar10,
  'avatar11.svg': avatar11,
  'avatar12.svg': avatar12,
  'avatar13.svg': avatar13,
};

export const getAvatarSrc = (filename) => avatarMap[filename] || avatar1; // fallback avatar1

export default avatarMap;