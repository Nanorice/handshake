const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Match = require('../models/Match');
require('dotenv').config();

// Increase Jest timeout for database operations
jest.setTimeout(30000);

// Test data
const testSeeker = {
  email: 'testseeker@example.com',
  password: 'password123',
  userType: 'seeker',
  firstName: 'Test',
  lastName: 'Seeker',
  profile: {
    bio: 'I am a test seeker',
    interests: ['Technology', 'Finance']
  }
};

const testProfessional = {
  email: 'testpro@example.com',
  password: 'password123',
  userType: 'professional',
  firstName: 'Test',
  lastName: 'Professional',
  profile: {
    bio: 'I am a test professional',
    industry: 'Technology',
    company: 'Test Corp',
    position: 'Senior Developer',
    location: 'New York',
    interests: ['Coding', 'Mentoring'],
    availability: [
      {
        day: 'Monday',
        timeSlots: ['09:00', '10:00', '11:00']
      }
    ]
  }
};

let seekerToken;
let proToken;
let professionalId;
let seekerId;
let matchId;

// Connect to test database before running tests
beforeAll(async () => {
  try {
    // Use the same MongoDB connection as the main app, but with a test database name
    const mainConnectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/handshake';
    const testConnectionString = mainConnectionString.replace(/\/[^/]+$/, '/handshake-test');
    
    await mongoose.connect(testConnectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Clear test database
    await User.deleteMany({});
    await Match.deleteMany({});
    
    console.log('Connected to test database');
  } catch (error) {
    console.error('Error connecting to test database:', error);
  }
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
  console.log('Database connection closed');
});

// Test auth endpoints
describe('Authentication', () => {
  test('Should register a new seeker user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testSeeker);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(testSeeker.email);
    expect(res.body.data.user.userType).toBe('seeker');
    expect(res.body.data.token).toBeDefined();
    
    seekerToken = res.body.data.token;
    seekerId = res.body.data.user._id;
  });
  
  test('Should register a new professional user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testProfessional);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(testProfessional.email);
    expect(res.body.data.user.userType).toBe('professional');
    expect(res.body.data.token).toBeDefined();
    
    proToken = res.body.data.token;
    professionalId = res.body.data.user._id;
  });
  
  test('Should login existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testSeeker.email,
        password: testSeeker.password
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.token).toBeDefined();
  });
  
  test('Should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testSeeker.email,
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// Test professional endpoints
describe('Professional Controller', () => {
  test('Should get all professionals', async () => {
    const res = await request(app)
      .get('/api/professionals')
      .set('Authorization', `Bearer ${seekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.professionals)).toBeTruthy();
    expect(res.body.data.professionals.length).toBe(1);
  });
  
  test('Should filter professionals by industry', async () => {
    const res = await request(app)
      .get('/api/professionals?industry=Technology')
      .set('Authorization', `Bearer ${seekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.professionals.length).toBe(1);
    expect(res.body.data.professionals[0].profile.industry).toBe('Technology');
  });
  
  test('Should get professional by ID', async () => {
    const res = await request(app)
      .get(`/api/professionals/${professionalId}`)
      .set('Authorization', `Bearer ${seekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.professional._id).toBe(professionalId);
    expect(res.body.data.professional.profile.industry).toBe('Technology');
  });
  
  test('Should update professional profile', async () => {
    const updatedProfile = {
      bio: 'Updated professional bio',
      industry: 'Software Development'
    };
    
    const res = await request(app)
      .put('/api/professionals/profile')
      .set('Authorization', `Bearer ${proToken}`)
      .send(updatedProfile);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.profile.bio).toBe(updatedProfile.bio);
    expect(res.body.data.profile.industry).toBe(updatedProfile.industry);
  });
  
  test('Should get available industries', async () => {
    const res = await request(app)
      .get('/api/professionals/industries')
      .set('Authorization', `Bearer ${seekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.industries)).toBeTruthy();
    expect(res.body.data.industries).toContain('Software Development');
  });
});

// Test match endpoints
describe('Match Controller', () => {
  test('Should send match request', async () => {
    const res = await request(app)
      .post('/api/matches/request')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        professionalId: professionalId
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.match.seeker).toBe(seekerId);
    expect(res.body.data.match.professional).toBe(professionalId);
    expect(res.body.data.match.status).toBe('pending');
    
    matchId = res.body.data.match._id;
  });
  
  test('Should get matches for seeker', async () => {
    const res = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${seekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.matches)).toBeTruthy();
    expect(res.body.data.matches.length).toBe(1);
  });
  
  test('Should get matches for professional', async () => {
    const res = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${proToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.matches)).toBeTruthy();
    expect(res.body.data.matches.length).toBe(1);
  });
  
  test('Should get match by ID', async () => {
    const res = await request(app)
      .get(`/api/matches/${matchId}`)
      .set('Authorization', `Bearer ${seekerToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.data.match._id).toBe(matchId);
  });
  
  test('Should accept match request', async () => {
    const res = await request(app)
      .put(`/api/matches/${matchId}/accept`)
      .set('Authorization', `Bearer ${proToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.match.status).toBe('accepted');
    expect(res.body.data.match.acceptedAt).toBeDefined();
  });
  
  test('Should fail to send duplicate match request', async () => {
    const res = await request(app)
      .post('/api/matches/request')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        professionalId: professionalId
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });
}); 