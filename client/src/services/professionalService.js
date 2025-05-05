import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Dummy professionals data
const dummyProfessionals = [
  {
    id: '1',
    firstName: 'Jessica',
    lastName: 'Parker',
    email: 'jparker@example.com',
    title: 'Senior Software Engineer',
    company: 'Google',
    industry: 'Technology',
    yearsOfExperience: 8,
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'React', 'Node.js', 'Cloud Computing', 'System Design'],
    bio: 'I have 8+ years of experience in full-stack development with a focus on scalable web applications. I love mentoring junior developers and sharing my knowledge about modern web development practices.',
    profilePicture: generateAvatar('1', 'Jessica', 'Parker'),
    availability: [
      { day: 'Monday', timeSlots: ['10:00 AM', '2:00 PM'] },
      { day: 'Wednesday', timeSlots: ['11:00 AM', '4:00 PM'] },
      { day: 'Friday', timeSlots: ['9:00 AM', '1:00 PM'] }
    ],
    expertise: ['Frontend Development', 'React Ecosystem', 'Performance Optimization'],
    rating: 4.9,
    reviewCount: 24
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@example.com',
    title: 'Product Manager',
    company: 'Microsoft',
    industry: 'Technology',
    yearsOfExperience: 6,
    location: 'Seattle, WA',
    skills: ['Product Strategy', 'User Research', 'Agile', 'Data Analysis', 'Roadmapping'],
    bio: 'Passionate product manager with experience in both B2B and B2C products. I specialize in product discovery and helping teams build products users love.',
    profilePicture: generateAvatar('2', 'Michael', 'Chen'),
    availability: [
      { day: 'Tuesday', timeSlots: ['3:00 PM', '5:00 PM'] },
      { day: 'Thursday', timeSlots: ['11:00 AM', '2:00 PM'] }
    ],
    expertise: ['Product Discovery', 'User Testing', 'Go-to-Market Strategy'],
    rating: 4.7,
    reviewCount: 19
  },
  {
    id: '3',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sjohnson@example.com',
    title: 'UX Designer',
    company: 'Adobe',
    industry: 'Design',
    yearsOfExperience: 5,
    location: 'Austin, TX',
    skills: ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'Design Systems'],
    bio: 'I help teams create beautiful and functional digital experiences. My specialty is in conversion-focused design for consumer applications.',
    profilePicture: generateAvatar('3', 'Sarah', 'Johnson'),
    availability: [
      { day: 'Monday', timeSlots: ['1:00 PM', '4:00 PM'] },
      { day: 'Wednesday', timeSlots: ['10:00 AM', '2:00 PM'] },
      { day: 'Friday', timeSlots: ['11:00 AM', '3:00 PM'] }
    ],
    expertise: ['UX Design', 'Mobile App Design', 'Design Systems'],
    rating: 4.8,
    reviewCount: 22
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'jwilson@example.com',
    title: 'Data Scientist',
    company: 'Amazon',
    industry: 'E-commerce',
    yearsOfExperience: 7,
    location: 'New York, NY',
    skills: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization'],
    bio: 'Data scientist with a background in mathematics and computer science. I enjoy solving complex problems with data and teaching others how to extract insights from their data.',
    profilePicture: generateAvatar('4', 'James', 'Wilson'),
    availability: [
      { day: 'Tuesday', timeSlots: ['9:00 AM', '1:00 PM'] },
      { day: 'Thursday', timeSlots: ['2:00 PM', '5:00 PM'] }
    ],
    expertise: ['Machine Learning', 'Data Analysis', 'Predictive Modeling'],
    rating: 4.6,
    reviewCount: 15
  },
  {
    id: '5',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'erodriguez@example.com',
    title: 'Marketing Director',
    company: 'Hubspot',
    industry: 'Marketing',
    yearsOfExperience: 10,
    location: 'Boston, MA',
    skills: ['Digital Marketing', 'Brand Strategy', 'Content Marketing', 'SEO', 'Social Media'],
    bio: 'Marketing leader who has helped grow multiple SaaS companies. I specialize in content strategy and inbound marketing techniques.',
    profilePicture: generateAvatar('5', 'Emily', 'Rodriguez'),
    availability: [
      { day: 'Monday', timeSlots: ['11:00 AM', '3:00 PM'] },
      { day: 'Wednesday', timeSlots: ['1:00 PM', '4:00 PM'] },
      { day: 'Friday', timeSlots: ['10:00 AM', '2:00 PM'] }
    ],
    expertise: ['Content Strategy', 'Growth Marketing', 'Brand Development'],
    rating: 4.9,
    reviewCount: 31
  },
  {
    id: '6',
    firstName: 'David',
    lastName: 'Kim',
    email: 'dkim@example.com',
    title: 'Finance Manager',
    company: 'Goldman Sachs',
    industry: 'Finance',
    yearsOfExperience: 9,
    location: 'Chicago, IL',
    skills: ['Financial Analysis', 'Investment Banking', 'Risk Management', 'Excel', 'Financial Modeling'],
    bio: 'Finance professional with experience in investment banking and corporate finance. I enjoy helping others understand financial concepts and planning their careers in finance.',
    profilePicture: generateAvatar('6', 'David', 'Kim'),
    availability: [
      { day: 'Tuesday', timeSlots: ['10:00 AM', '2:00 PM'] },
      { day: 'Thursday', timeSlots: ['1:00 PM', '5:00 PM'] }
    ],
    expertise: ['Investment Analysis', 'Financial Planning', 'Corporate Finance'],
    rating: 4.7,
    reviewCount: 17
  },
  {
    id: '7',
    firstName: 'Olivia',
    lastName: 'Martinez',
    email: 'omartinez@example.com',
    title: 'HR Director',
    company: 'Salesforce',
    industry: 'Human Resources',
    yearsOfExperience: 12,
    location: 'San Diego, CA',
    skills: ['Talent Acquisition', 'Employee Relations', 'Performance Management', 'DEI Initiatives', 'Leadership Development'],
    bio: 'HR leader passionate about building inclusive workplaces. I specialize in talent development and creating positive work cultures.',
    profilePicture: generateAvatar('7', 'Olivia', 'Martinez'),
    availability: [
      { day: 'Monday', timeSlots: ['9:00 AM', '1:00 PM'] },
      { day: 'Wednesday', timeSlots: ['2:00 PM', '5:00 PM'] },
      { day: 'Friday', timeSlots: ['10:00 AM', '3:00 PM'] }
    ],
    expertise: ['Talent Management', 'Organizational Development', 'Workplace Culture'],
    rating: 4.8,
    reviewCount: 26
  },
  {
    id: '8',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'rtaylor@example.com',
    title: 'Project Manager',
    company: 'IBM',
    industry: 'Technology',
    yearsOfExperience: 8,
    location: 'Denver, CO',
    skills: ['Agile', 'Scrum', 'Project Planning', 'Stakeholder Management', 'Risk Management'],
    bio: 'Certified PMP with experience managing cross-functional teams. I help teams deliver complex projects on time and within budget.',
    profilePicture: generateAvatar('8', 'Robert', 'Taylor'),
    availability: [
      { day: 'Tuesday', timeSlots: ['11:00 AM', '3:00 PM'] },
      { day: 'Thursday', timeSlots: ['10:00 AM', '2:00 PM'] }
    ],
    expertise: ['Agile Project Management', 'Team Leadership', 'Project Planning'],
    rating: 4.6,
    reviewCount: 20
  }
];

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

// Get all professionals
export const getProfessionals = async (filters = {}) => {
  try {
    // Import userService to access our seeded test users
    const userService = require('./userService').default;
    
    // Get the test professional users
    const testProfessionals = await userService.getProfessionals();
    
    // Map the test users to match the expected format
    let filteredProfessionals = testProfessionals.map(prof => {
      return {
        id: prof._id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        email: prof.email,
        title: prof.profile?.title || 'Professional',
        company: prof.profile?.company || 'Company',
        industry: prof.profile?.industry || 'Technology',
        yearsOfExperience: prof.profile?.yearsOfExperience || 5,
        location: prof.profile?.location || 'Remote',
        skills: prof.profile?.skills || ['Mentoring', 'Career Advice'],
        bio: prof.profile?.bio || 'Experienced professional ready to help.',
        profilePicture: generateAvatar(prof._id, prof.firstName, prof.lastName),
        availability: [
          { day: 'Monday', timeSlots: ['10:00 AM', '2:00 PM'] },
          { day: 'Wednesday', timeSlots: ['11:00 AM', '4:00 PM'] },
        ],
        expertise: prof.profile?.expertise || ['Career Development', 'Mentorship'],
        rating: 4.8,
        reviewCount: Math.floor(Math.random() * 30) + 5
      };
    });
    
    // Apply industry filter
    if (filters.industry && filters.industry !== 'All') {
      filteredProfessionals = filteredProfessionals.filter(
        prof => prof.industry === filters.industry
      );
    }
    
    // Apply experience filter
    if (filters.experienceLevel) {
      const expRanges = {
        'entry': { min: 0, max: 3 },
        'mid': { min: 3, max: 7 },
        'senior': { min: 7, max: 100 }
      };
      
      const range = expRanges[filters.experienceLevel];
      if (range) {
        filteredProfessionals = filteredProfessionals.filter(
          prof => prof.yearsOfExperience >= range.min && prof.yearsOfExperience <= range.max
        );
      }
    }
    
    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredProfessionals = filteredProfessionals.filter(prof => {
        const fullName = `${prof.firstName} ${prof.lastName}`.toLowerCase();
        const title = prof.title.toLowerCase();
        const company = prof.company.toLowerCase();
        
        return (
          fullName.includes(searchLower) ||
          title.includes(searchLower) ||
          company.includes(searchLower) ||
          (prof.skills && prof.skills.some(skill => skill.toLowerCase().includes(searchLower)))
        );
      });
    }
    
    return {
      professionals: filteredProfessionals
    };
  } catch (error) {
    console.error('Error fetching professionals:', error);
    
    // Fallback to empty array on error
    return {
      professionals: []
    };
  }
};

// Get a professional by ID
export const getProfessionalById = async (id) => {
  try {
    // Import userService to access our seeded test users
    const userService = require('./userService').default;
    
    // Get all test professional users
    const testProfessionals = await userService.getProfessionals();
    
    // Find the professional with matching ID
    const professional = testProfessionals.find(p => p._id === id);
    
    if (!professional) {
      throw new Error(`Professional with ID ${id} not found`);
    }
    
    // Map the test user to match the expected format
    return { 
      professional: {
        id: professional._id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        email: professional.email,
        title: professional.profile?.title || 'Professional',
        company: professional.profile?.company || 'Company',
        industry: professional.profile?.industry || 'Technology',
        yearsOfExperience: professional.profile?.yearsOfExperience || 5,
        location: professional.profile?.location || 'Remote',
        skills: professional.profile?.skills || ['Mentoring', 'Career Advice'],
        bio: professional.profile?.bio || 'Experienced professional ready to help.',
        profilePicture: generateAvatar(professional._id, professional.firstName, professional.lastName),
        availability: [
          { day: 'Monday', timeSlots: ['10:00 AM', '2:00 PM'] },
          { day: 'Wednesday', timeSlots: ['11:00 AM', '4:00 PM'] },
        ],
        expertise: professional.profile?.expertise || ['Career Development', 'Mentorship'],
        rating: 4.8,
        reviewCount: Math.floor(Math.random() * 30) + 5
      }
    };
  } catch (error) {
    console.error('Error fetching professional by ID:', error);
    throw error;
  }
};

// Request a match with a professional
export const requestMatch = async (professionalId, userData) => {
  try {
    // In a real app, we'd make an API call
    // const response = await axios.post(`${API_URL}/matches/request`, {
    //   professionalId,
    //   ...userData
    // });
    // return response.data;
    
    // For now, we'll simulate a successful request
    return {
      status: 'success',
      message: 'Match request sent successfully',
      matchId: `match_${Date.now()}`,
      professional: dummyProfessionals.find(p => p.id === professionalId)
    };
  } catch (error) {
    throw error;
  }
};

// Get all matches for the current user
export const getUserMatches = async () => {
  try {
    // In a real app, we'd make an API call with the user's token
    // const response = await axios.get(`${API_URL}/matches/user`);
    // return response.data;
    
    // For now, we'll return dummy data
    // Assume we have matched with some of the professionals
    const matchedProfessionals = dummyProfessionals.slice(0, 3).map(prof => ({
      id: `match_${prof.id}`,
      professional: prof,
      status: Math.random() > 0.5 ? 'pending' : 'accepted',
      requestedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      messages: []
    }));
    
    return { matches: matchedProfessionals };
  } catch (error) {
    throw error;
  }
};

// Get all messages for the current user
export const getUserMessages = async () => {
  try {
    // In a real app, we'd make an API call with the user's token
    // const response = await axios.get(`${API_URL}/messages`);
    // return response.data;
    
    // For now, we'll create dummy messages from matched professionals
    const dummyMessages = [];
    
    // Generate dummy conversations with professionals
    dummyProfessionals.slice(0, 5).forEach(prof => {
      // Create a conversation thread
      const threadId = `thread_${prof.id}`;
      const messageCount = Math.floor(Math.random() * 5) + 1; // 1-5 messages
      
      // Generate messages in this thread
      for (let i = 0; i < messageCount; i++) {
        const isFromUser = Math.random() > 0.5;
        const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
        
        // Push simulated message
        dummyMessages.push({
          id: `msg_${prof.id}_${i}`,
          threadId,
          professional: {
            id: prof.id,
            firstName: prof.firstName,
            lastName: prof.lastName,
            title: prof.title,
            company: prof.company,
            profilePicture: prof.profilePicture
          },
          content: isFromUser 
            ? getSampleUserMessage() 
            : getSampleProfessionalMessage(),
          sentBy: isFromUser ? 'user' : 'professional',
          isRead: isFromUser ? true : Math.random() > 0.3, // 70% chance professional messages are read
          createdAt: createdAt.toISOString(),
          messageType: 'text', // Add message type to distinguish between text messages and special messages
        });
      }
    });
    
    // Sort messages by date (newest first)
    dummyMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return { messages: dummyMessages };
  } catch (error) {
    throw error;
  }
};

// Send a message to a professional
export const sendMessage = async (professionalId, content, messageType = 'text', metadata = null) => {
  try {
    // In a real app, we'd make an API call
    // const response = await axios.post(`${API_URL}/messages`, {
    //   professionalId,
    //   content,
    //   messageType,
    //   metadata
    // });
    // return response.data;
    
    // For now, simulate success
    const professional = dummyProfessionals.find(p => p.id === professionalId);
    
    return { 
      status: 'success',
      message: {
        id: `msg_${Date.now()}`,
        threadId: `thread_${professionalId}`,
        professional: {
          id: professional.id,
          firstName: professional.firstName,
          lastName: professional.lastName,
          title: professional.title,
          company: professional.company,
          profilePicture: professional.profilePicture
        },
        content,
        messageType,
        metadata,
        sentBy: 'user',
        isRead: true,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
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
    throw error;
  }
};

// Professional proposes time slots
export const proposeTimeSlots = async (threadId, inviteId, timeSlots, message) => {
  try {
    // Get professional ID from thread ID
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
    throw error;
  }
};

// Seeker suggests alternative time slots
export const suggestAlternativeTimeSlots = async (threadId, inviteId, timeSlots, message) => {
  try {
    // Get professional ID from thread ID
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
    throw error;
  }
};

// Professional confirms time slot
export const confirmTimeSlot = async (threadId, inviteId, selectedTimeSlot, message) => {
  try {
    // Get professional ID from thread ID
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
    throw error;
  }
};

// Seeker confirms and proceeds to payment
export const confirmAndPay = async (threadId, inviteId, selectedTimeSlot, paymentDetails) => {
  try {
    // Get professional ID from thread ID
    const professionalId = threadId.replace('thread_', '');
    
    // In a real app, we would process payment here
    // const paymentResponse = await axios.post(`${API_URL}/payments`, {
    //   professionalId,
    //   inviteId,
    //   selectedTimeSlot,
    //   ...paymentDetails
    // });
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If payment is successful, send confirmation message
    return await sendMessage(
      professionalId,
      "I've confirmed and completed payment for our coffee chat!",
      'payment_confirmation',
      {
        inviteId,
        selectedTimeSlot,
        paymentId: `payment_${Date.now()}`,
        paymentStatus: 'completed',
        status: 'booked'
      }
    );
  } catch (error) {
    throw error;
  }
};

// Helper function to format time slot
function formatTimeSlot(timeSlot) {
  const date = new Date(timeSlot.date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `${formattedDate} at ${timeSlot.time}`;
}

// Helper functions to generate realistic message content
function getSampleUserMessage() {
  const userMessages = [
    "Thanks for accepting my match request! I'm interested in learning more about your experience in the industry.",
    "I'd love to schedule a coffee chat to discuss career opportunities in your field.",
    "Do you have any advice for someone looking to transition into your area of expertise?",
    "I saw your background in product development. Could you share some insights about how you approach problem-solving?",
    "Thank you for the advice you shared in our last conversation. It was really helpful!",
    "I'm preparing for an interview next week. Any tips on how to stand out?",
    "Would it be possible to schedule a 30-minute call sometime this week?",
    "I've been researching the companies you've worked with. What was your favorite project?",
    "The resources you recommended were excellent. I've already started going through them.",
    "Just following up on our conversation from last week. Let me know when you're available to chat!"
  ];
  
  return userMessages[Math.floor(Math.random() * userMessages.length)];
}

function getSampleProfessionalMessage() {
  const professionalMessages = [
    "Happy to connect! I'd be glad to share my insights about the industry with you.",
    "Thanks for reaching out. I think my experience in this field could be valuable for your career journey.",
    "I'd be happy to schedule a coffee chat. How does next Tuesday at 3 PM sound?",
    "Based on what you've shared, I think focusing on developing these specific skills would be most beneficial for you.",
    "Great question! In my experience, the most successful approach has been to...",
    "I've attached some resources that I think will help you prepare for your interview.",
    "Let's definitely set up a call. My availability this week is Tuesday 2-4pm or Thursday 9-11am.",
    "From your background, I see a lot of potential for growth in this area. Let me explain why...",
    "Don't hesitate to reach out if you have more questions after reviewing the materials I sent.",
    "It was great chatting with you. I've made a note to connect you with my colleague who specializes in that area."
  ];
  
  return professionalMessages[Math.floor(Math.random() * professionalMessages.length)];
} 