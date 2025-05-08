import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';

// Define API_URL with explicit port 5000 to match what the browser is using
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('professionalService API_URL initialized as:', API_URL);

// Get all professionals
export const getProfessionals = async (filters = {}) => {
  try {
    console.log('Fetching professionals with filters:', filters);
    
    // Get auth token
    const token = getAuthToken();
    
    // Ensure we have the correct URL format
    const baseUrl = API_URL.includes('/api') ? API_URL : `${API_URL}/api`;
    
    // Make the API call with the token if available
    const fullUrl = `${baseUrl}/professionals`.replace(/\/+/g, '/').replace(':/', '://');
    console.log(`Making API request to: ${fullUrl}`);
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using token for request:', token.substring(0, 10) + '...');
    } else {
      console.warn('No auth token available for professionals request');
    }
    
    const response = await axios.get(fullUrl, { 
      params: filters,
      headers
    });
    
    console.log('Professionals API raw response:', response);
    console.log('Professionals API response data:', response.data);
    
    if (response.data && response.data.success) {
      console.log('API response success. Full data structure:', JSON.stringify(response.data));
      
      // Use mock data if no real professionals found (for development)
      if (response.data.data && 
          response.data.data.professionals && 
          response.data.data.professionals.length === 0) {
        console.log('No real professionals found, but NOT returning mock data to diagnose issue');
        
        // Comment out mock data to ensure we see real server response
        /*
        return {
          professionals: [
            {
              _id: 'mock1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'johndoe@example.com',
              profileImage: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
              role: 'professional',
              profile: {
                title: 'Senior Developer',
                skills: ['JavaScript', 'React', 'Node.js'],
                rate: 100,
                industries: ['Technology']
              }
            },
            {
              _id: 'mock2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'janesmith@example.com',
              profileImage: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
              role: 'professional',
              profile: {
                title: 'UX Designer',
                skills: ['UI/UX', 'Figma', 'Adobe XD'],
                rate: 85,
                industries: ['Design']
              }
            }
          ]
        };
        */
      }
      
      return response.data.data;
    }
    
    console.warn('API response successful but no data found');
    return { professionals: [] };
  } catch (error) {
    console.error('Error fetching professionals:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from API');
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    return { professionals: [] };
  }
};

// Get a professional by ID
export const getProfessionalById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/professionals/${id}`);
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    
    throw new Error(`Professional with ID ${id} not found`);
  } catch (error) {
    console.error('Error fetching professional by ID:', error);
    throw error;
  }
};

// Request a match with a professional
export const requestMatch = async (professionalId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(`${API_URL}/matches/request`, {
      professionalId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error requesting match:', error);
    throw error;
  }
};

// Get user matches
export const getUserMatches = async () => {
  try {
    // Get auth token using our helper
    const token = getAuthToken();
    
    if (!token) {
      console.error('No authentication token found in localStorage');
      console.log('Auth state check: Token missing, localStorage contents:', {
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        hasUserData: !!localStorage.getItem('userData'),
        hasUserId: !!localStorage.getItem('userId')
      });
      throw new Error('No authentication token found');
    }
    
    // Log token details for debugging
    console.log('Using token for request:', token.substring(0, 10) + '...');
    
    // Log the API_URL value to check what's actually being used
    console.log('API_URL value:', API_URL);
    
    // Make sure we're using the correct API URL format
    const baseUrl = API_URL.includes('/api') ? API_URL : `${API_URL}/api`;
    
    // Make the API call with the existing token
    const fullUrl = `${baseUrl}/matches`.replace(/\/+/g, '/').replace(':/', '://');
    console.log(`Making API request to: ${fullUrl}`);
    
    const response = await axios.get(fullUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    
    // If no matches data is returned, return empty array
    return { matches: [] };
  } catch (error) {
    console.error('Error fetching matches:', error);
    
    // If there's an auth error, throw it so the component can handle it
    if (error.response && error.response.status === 401) {
      throw new Error('Authentication required');
    }
    
    throw error;
  }
};

// Get all messages for the current user
export const getUserMessages = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get(`${API_URL}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    
    return { messages: [] };
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Send a message to a professional
export const sendMessage = async (professionalId, content, messageType = 'text', metadata = null) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(`${API_URL}/messages`, {
      professionalId,
        content,
        messageType,
      metadata
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Send a coffee chat invitation
export const sendCoffeeChatInvite = async (professionalId, message) => {
  try {
    return await sendMessage(
      professionalId, 
      message,
      'invite',
      {
        status: 'pending',
        inviteId: `invite_${Date.now()}`
      }
    );
  } catch (error) {
    console.error('Error sending coffee chat invitation:', error);
    throw error;
  }
};

// Professional proposes time slots
export const proposeTimeSlots = async (threadId, inviteId, timeSlots, message) => {
  try {
    const professionalId = threadId.replace('thread_', '');
    
    return await sendMessage(
      professionalId,
      message || "Here are some time slots that work for me:",
      'time_proposal',
      {
        inviteId,
        timeSlots,
        status: 'proposed'
      }
    );
  } catch (error) {
    console.error('Error proposing time slots:', error);
    throw error;
  }
};

// Seeker suggests alternative time slots
export const suggestAlternativeTimeSlots = async (threadId, inviteId, timeSlots, message) => {
  try {
    const professionalId = threadId.replace('thread_', '');
    
    return await sendMessage(
      professionalId,
      message || "Could we try these times instead?",
      'time_suggestion',
      {
        inviteId,
        timeSlots,
        status: 'suggested'
      }
    );
  } catch (error) {
    console.error('Error suggesting alternative time slots:', error);
    throw error;
  }
};

// Professional confirms time slot
export const confirmTimeSlot = async (threadId, inviteId, selectedTimeSlot, message) => {
  try {
    const professionalId = threadId.replace('thread_', '');
    
    return await sendMessage(
      professionalId,
      message || `I've confirmed our meeting for ${formatTimeSlot(selectedTimeSlot)}.`,
      'time_confirmation',
      {
        inviteId,
        selectedTimeSlot,
        status: 'confirmed'
      }
    );
  } catch (error) {
    console.error('Error confirming time slot:', error);
    throw error;
  }
};

// Seeker confirms and proceeds to payment
export const confirmAndPay = async (threadId, inviteId, selectedTimeSlot, paymentDetails) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(`${API_URL}/payments`, {
      threadId,
        inviteId,
        selectedTimeSlot,
      ...paymentDetails
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// Helper function to format time slot
function formatTimeSlot(timeSlot) {
  if (!timeSlot || !timeSlot.date) return 'Invalid time slot';
  
  const date = new Date(timeSlot.date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `${formattedDate} at ${timeSlot.time}`;
} 