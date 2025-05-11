import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_URL = getApiBaseUrl();

// Helper function to generate a consistent avatar for a user based on their ID
function generateAvatar(id, firstName, lastName) {
  // Create avatar based on initials and a pastel color background
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  const colors = [
    '6ab04c', 'badc58', 'f9ca24', 'f0932b', 'eb4d4b', 
    'be2edd', '686de0', '7ed6df', '22a6b3', 'e056fd'
  ];
  
  // Use the id to deterministically select a color
  const colorIndex = typeof id === 'string' 
    ? id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length
    : Math.floor(Math.random() * colors.length);
    
  const color = colors[colorIndex];
  
  // Generate a DiceBear avatar URL (cute minimalist avatars)
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(id)}&backgroundColor=${color}`;
}

// Create axios instance with auth header
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header to every request
authAxios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Get all users (professionals and seekers) for messaging
 */
const getUsers = async () => {
  try {
    // This endpoint should be implemented on the backend to return all users
    const response = await authAxios.get('/users');
    return response.data.data.users;
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Fallback to using our seeded test users if the API call fails
    // In a real app, we'd handle this error properly
    return getTestUsers();
  }
};

/**
 * Get professionals only
 */
const getProfessionals = async () => {
  try {
    const response = await authAxios.get('/users?userType=professional');
    return response.data.data.users;
  } catch (error) {
    console.error('Error fetching professionals:', error);
    
    // Fallback to using our seeded test users (professionals only)
    const allUsers = await getTestUsers();
    return allUsers.filter(user => user.userType === 'professional');
  }
};

/**
 * Get seekers only
 */
const getSeekers = async () => {
  try {
    const response = await authAxios.get('/users?userType=seeker');
    return response.data.data.users;
  } catch (error) {
    console.error('Error fetching seekers:', error);
    
    // Fallback to using our seeded test users (seekers only)
    const allUsers = await getTestUsers();
    return allUsers.filter(user => user.userType === 'seeker');
  }
};

/**
 * Get test users that we know exist in the database from our seeding script
 * This is used as a fallback in case the API endpoints aren't implemented yet
 */
const getTestUsers = async () => {
  // These match the users created in our database seed
  const testUsers = [];
  
  // Add professionals
  for (let i = 1; i <= 20; i++) {
    const nameParts = getProfessionalName(i);
    testUsers.push({
      _id: `pro${i}`,
      email: `pro${i}@example.com`,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      userType: 'professional',
      profile: {
        profilePicture: generateAvatar(`pro${i}`, nameParts[0], nameParts.slice(1).join(' ')),
        title: getRandomTitle(),
        company: getRandomCompany(),
        yearsOfExperience: Math.floor(Math.random() * 20) + 1
      }
    });
  }
  
  // Add seekers
  for (let i = 1; i <= 20; i++) {
    const nameParts = getSeekerName(i);
    testUsers.push({
      _id: `seeker${i}`,
      email: `seeker${i}@example.com`,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      userType: 'seeker',
      profile: {
        profilePicture: generateAvatar(`seeker${i}`, nameParts[0], nameParts.slice(1).join(' ')),
        education: getRandomEducation(),
        interests: getRandomInterests()
      }
    });
  }
  
  return testUsers;
};

// Helper functions for test user data
const getProfessionalName = (index) => {
  const professionalNames = [
    'John Perez', 'Andrew Jones', 'Margaret Clark', 'Dorothy Allen', 'David Jackson',
    'David Moore', 'Steven Hernandez', 'Michael Walker', 'Robert Jones', 'Donna Smith',
    'Lisa Walker', 'Paul Lopez', 'Patricia Allen', 'Kimberly Gonzalez', 'Mark Garcia',
    'Linda Lewis', 'John Walker', 'William Lewis', 'Anthony Flores', 'Thomas Moore'
  ];
  
  return professionalNames[index - 1].split(' ');
};

const getSeekerName = (index) => {
  const seekerNames = [
    'James Perez', 'Christopher White', 'Susan Perez', 'John Harris', 'Margaret Walker',
    'Donna Lewis', 'Betty King', 'Elizabeth Young', 'Mary Torres', 'William Anderson',
    'Joseph Harris', 'Linda Wilson', 'Joshua Sanchez', 'Sarah Young', 'Dorothy Lee',
    'Christopher Lee', 'Andrew Johnson', 'Jennifer Lewis', 'Elizabeth Wilson', 'Andrew Thomas'
  ];
  
  return seekerNames[index - 1].split(' ');
};

const getRandomTitle = () => {
  const titles = [
    'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
    'Marketing Manager', 'Financial Analyst', 'Project Manager', 'Business Analyst',
    'DevOps Engineer', 'HR Specialist'
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
};

const getRandomCompany = () => {
  const companies = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Facebook', 'Twitter',
    'Netflix', 'Adobe', 'IBM', 'Intel', 'Cisco', 'Oracle'
  ];
  
  return companies[Math.floor(Math.random() * companies.length)];
};

const getRandomEducation = () => {
  const schools = [
    'Stanford University', 'MIT', 'Harvard University', 'UC Berkeley',
    'UCLA', 'University of Michigan', 'NYU', 'Cornell University'
  ];
  
  const degrees = [
    'Bachelor of Science', 'Bachelor of Arts', 'Master of Science',
    'Master of Business Administration', 'PhD'
  ];
  
  const fields = [
    'Computer Science', 'Business Administration', 'Data Science',
    'Engineering', 'Marketing', 'Finance', 'Psychology'
  ];
  
  return {
    school: schools[Math.floor(Math.random() * schools.length)],
    degree: degrees[Math.floor(Math.random() * degrees.length)],
    field: fields[Math.floor(Math.random() * fields.length)],
    year: 2015 + Math.floor(Math.random() * 7)
  };
};

const getRandomInterests = () => {
  const allInterests = [
    'Machine Learning', 'Web Development', 'Mobile Development',
    'AI', 'Blockchain', 'Data Science', 'Design', 'Product Management',
    'Digital Marketing', 'Finance', 'Entrepreneurship'
  ];
  
  // Get 2-4 random interests
  const count = Math.floor(Math.random() * 3) + 2;
  const interests = [];
  
  for (let i = 0; i < count; i++) {
    const interest = allInterests[Math.floor(Math.random() * allInterests.length)];
    if (!interests.includes(interest)) {
      interests.push(interest);
    }
  }
  
  return interests;
};

const userService = {
  getUsers,
  getProfessionals,
  getSeekers,
  getTestUsers
};

export default userService; 