// Popular first names and last names for account generation
const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
  'George', 'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan',
  'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra',
  'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol',
  'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
];

export interface UserInfo {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  birthday: {
    month: number;
    day: number;
    year: number;
  };
}

/**
 * Generates a random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random password
 */
function generatePassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generates a random birthday (age between 18-65)
 */
function generateBirthday(): { month: number; day: number; year: number } {
  const currentYear = new Date().getFullYear();
  const age = randomInt(18, 65);
  const year = currentYear - age;
  const month = randomInt(1, 12);
  const day = randomInt(1, 28); // Use 28 to avoid month-specific day issues
  return { month, day, year };
}

/**
 * Generates a username in format: firstname.lastname + 5 random digits
 */
function generateUsername(firstName: string, lastName: string): string {
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomDigits}`;
}

/**
 * Generates random user information for Gmail account creation
 */
export function generateUserInfo(): UserInfo {
  const firstName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
  const lastName = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
  const username = generateUsername(firstName, lastName);
  const password = generatePassword();
  const birthday = generateBirthday();

  return {
    firstName,
    lastName,
    username,
    password,
    email: `${username}@gmail.com`,
    birthday,
  };
}

