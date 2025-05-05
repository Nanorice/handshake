// Mock data for development and demonstration purposes

// Professional data
export const MOCK_PROFESSIONALS = [
  {
    id: 'p1',
    userId: 'u1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
    industry: 'Technology',
    seniority: 'Senior',
    expertise: ['Product Management', 'UX Design', 'Agile Methodology'],
    hourlyRate: 85,
    bio: 'Senior Product Manager with 10+ years of experience in tech companies. I specialize in product strategy, user experience, and agile methodologies. Happy to share insights on product development, career growth, and leadership in tech.',
    isVerified: true,
    rating: 4.8,
    totalSessions: 35
  },
  {
    id: 'p2',
    userId: 'u2',
    firstName: 'Michael',
    lastName: 'Chen',
    profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
    industry: 'Finance',
    seniority: 'Director',
    expertise: ['Investment Banking', 'Financial Analysis', 'Venture Capital'],
    hourlyRate: 120,
    bio: 'Investment Banking Director with expertise in M&A, fundraising, and financial analysis. Previously worked at Goldman Sachs and JP Morgan. Can provide guidance on careers in finance, deal structuring, and financial modeling.',
    isVerified: true,
    rating: 4.9,
    totalSessions: 27
  },
  {
    id: 'p3',
    userId: 'u3',
    firstName: 'Priya',
    lastName: 'Patel',
    profilePicture: 'https://randomuser.me/api/portraits/women/68.jpg',
    industry: 'Healthcare',
    seniority: 'Manager',
    expertise: ['Healthcare Operations', 'Patient Experience', 'Regulatory Compliance'],
    hourlyRate: 75,
    bio: 'Healthcare Operations Manager with experience in hospital administration and digital health startups. Passionate about improving patient experience and healthcare delivery through technology and process optimization.',
    isVerified: false,
    rating: 4.6,
    totalSessions: 12
  },
  {
    id: 'p4',
    userId: 'u4',
    firstName: 'David',
    lastName: 'Wilson',
    profilePicture: 'https://randomuser.me/api/portraits/men/46.jpg',
    industry: 'Technology',
    seniority: 'Senior',
    expertise: ['Software Engineering', 'JavaScript', 'React', 'Node.js'],
    hourlyRate: 95,
    bio: 'Full Stack Software Engineer with 8+ years of experience in web and mobile development. Currently engineering lead at a fintech startup. I can provide guidance on technical interviews, career development, and building scalable applications.',
    isVerified: true,
    rating: 4.7,
    totalSessions: 19
  },
  {
    id: 'p5',
    userId: 'u5',
    firstName: 'Olivia',
    lastName: 'Garcia',
    profilePicture: 'https://randomuser.me/api/portraits/women/25.jpg',
    industry: 'Marketing',
    seniority: 'Director',
    expertise: ['Digital Marketing', 'Brand Strategy', 'Growth Marketing'],
    hourlyRate: 110,
    bio: 'Marketing Director with experience at Fortune 500 companies and high-growth startups. I specialize in digital marketing, brand development, and growth strategies. Happy to discuss marketing careers, campaign development, and measuring marketing ROI.',
    isVerified: true,
    rating: 4.9,
    totalSessions: 41
  },
  {
    id: 'p6',
    userId: 'u6',
    firstName: 'James',
    lastName: 'Thompson',
    profilePicture: 'https://randomuser.me/api/portraits/men/64.jpg',
    industry: 'Consulting',
    seniority: 'Manager',
    expertise: ['Management Consulting', 'Strategy', 'Business Analysis'],
    hourlyRate: 100,
    bio: 'Management Consultant with experience at McKinsey and Bain. I help companies solve complex business problems and develop growth strategies. Can provide advice on case interviews, consulting careers, and strategic thinking.',
    isVerified: false,
    rating: 4.5,
    totalSessions: 8
  }
];

// Time slot data
export const MOCK_TIME_SLOTS = [
  {
    id: 'ts1',
    day: 'Monday',
    date: '2023-09-18',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    isAvailable: true
  },
  {
    id: 'ts2',
    day: 'Monday',
    date: '2023-09-18',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    isAvailable: true
  },
  {
    id: 'ts3',
    day: 'Monday',
    date: '2023-09-18',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    isAvailable: false
  },
  {
    id: 'ts4',
    day: 'Tuesday',
    date: '2023-09-19',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    isAvailable: true
  },
  {
    id: 'ts5',
    day: 'Tuesday',
    date: '2023-09-19',
    startTime: '01:00 PM',
    endTime: '02:00 PM',
    isAvailable: true
  },
  {
    id: 'ts6',
    day: 'Wednesday',
    date: '2023-09-20',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    isAvailable: true
  },
  {
    id: 'ts7',
    day: 'Wednesday',
    date: '2023-09-20',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    isAvailable: true
  },
  {
    id: 'ts8',
    day: 'Thursday',
    date: '2023-09-21',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    isAvailable: false
  },
  {
    id: 'ts9',
    day: 'Thursday',
    date: '2023-09-21',
    startTime: '03:00 PM',
    endTime: '04:00 PM',
    isAvailable: true
  },
  {
    id: 'ts10',
    day: 'Friday',
    date: '2023-09-22',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    isAvailable: true
  }
];

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