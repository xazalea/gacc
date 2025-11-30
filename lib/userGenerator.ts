// Minimal name lists
const FIRST_NAMES = ['John', 'Mary', 'James', 'Sarah', 'Michael', 'Emily'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'];

export interface UserInfo {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  birthday: { month: number; day: number; year: number };
}

export function generateUserInfo(): UserInfo {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const randomChars = Array.from({ length: 4 }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]).join('');
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomChars}${randomDigits}`;
  const password = Array.from({ length: 12 }, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]).join('');
  const year = new Date().getFullYear() - Math.floor(Math.random() * 47 + 18);
  
  return {
    firstName,
    lastName,
    username,
    password,
    email: `${username}@gmail.com`,
    birthday: { month: Math.floor(Math.random() * 12 + 1), day: Math.floor(Math.random() * 28 + 1), year },
  };
}
