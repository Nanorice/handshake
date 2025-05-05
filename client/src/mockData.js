// Mock data for development and demonstration purposes

// Coffee chat data
export const MOCK_COFFEE_CHATS = [
  {
    id: 'cc1',
    status: 'confirmed',
    scheduledTime: '2023-09-20T14:00:00Z',
    duration: 60,
    price: 85,
    professional: {
      id: 'p1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
      industry: 'Technology',
      seniority: 'Senior'
    },
    preferences: {
      topics: ['Career Advice', 'Product Management', 'Leadership']
    },
    zoomLink: 'https://zoom.us/j/1234567890'
  },
  {
    id: 'cc2',
    status: 'pending',
    scheduledTime: '2023-09-25T10:00:00Z',
    duration: 30,
    price: 60,
    professional: {
      id: 'p4',
      firstName: 'David',
      lastName: 'Wilson',
      profilePicture: 'https://randomuser.me/api/portraits/men/46.jpg',
      industry: 'Technology',
      seniority: 'Senior'
    },
    preferences: {
      topics: ['Technical Interviews', 'Web Development']
    }
  },
  {
    id: 'cc3',
    status: 'completed',
    scheduledTime: '2023-09-10T15:00:00Z',
    duration: 60,
    price: 110,
    professional: {
      id: 'p5',
      firstName: 'Olivia',
      lastName: 'Garcia',
      profilePicture: 'https://randomuser.me/api/portraits/women/25.jpg',
      industry: 'Marketing',
      seniority: 'Director'
    },
    preferences: {
      topics: ['Digital Marketing', 'Brand Strategy']
    }
  }
]; 