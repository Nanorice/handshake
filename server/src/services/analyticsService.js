const User = require('../models/User');
const Message = require('../models/Message');
const Thread = require('../models/Thread');
const Invitation = require('../models/Invitation');
const Match = require('../models/Match');
const ProfessionalProfile = require('../models/ProfessionalProfile');

class AnalyticsService {
  // User Growth & Engagement Metrics
  static async getUserGrowthMetrics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeToday,
        activeWeek,
        activeMonth,
        newToday,
        newWeek,
        newMonth,
        professionals,
        seekers
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ lastActive: { $gte: today } }),
        User.countDocuments({ lastActive: { $gte: weekAgo } }),
        User.countDocuments({ lastActive: { $gte: monthAgo } }),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        User.countDocuments({ createdAt: { $gte: monthAgo } }),
        User.countDocuments({ userType: 'professional' }),
        User.countDocuments({ userType: 'seeker' })
      ]);

      return {
        totalUsers,
        activeUsers: {
          today: activeToday,
          week: activeWeek,
          month: activeMonth
        },
        newUsers: {
          today: newToday,
          week: newWeek,
          month: newMonth
        },
        userTypes: {
          professionals,
          seekers
        }
      };
    } catch (error) {
      console.error('Error fetching user growth metrics:', error);
      throw error;
    }
  }

  // Messaging Analytics
  static async getMessagingMetrics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalMessages,
        messagesToday,
        messagesWeek,
        totalThreads,
        activeThreadsToday,
        avgMessagesPerThread
      ] = await Promise.all([
        Message.countDocuments(),
        Message.countDocuments({ createdAt: { $gte: today } }),
        Message.countDocuments({ createdAt: { $gte: weekAgo } }),
        Thread.countDocuments(),
        Thread.countDocuments({ updatedAt: { $gte: today } }),
        Message.aggregate([
          { $group: { _id: '$threadId', count: { $sum: 1 } } },
          { $group: { _id: null, avgMessages: { $avg: '$count' } } }
        ])
      ]);

      return {
        totalMessages,
        messagesPerPeriod: {
          today: messagesToday,
          week: messagesWeek
        },
        totalThreads,
        activeThreadsToday,
        avgMessagesPerThread: avgMessagesPerThread[0]?.avgMessages || 0
      };
    } catch (error) {
      console.error('Error fetching messaging metrics:', error);
      throw error;
    }
  }

  // Professional Interaction Metrics
  static async getProfessionalMetrics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalInvitations,
        invitationsToday,
        invitationsWeek,
        acceptedInvitations,
        totalMatches,
        matchesToday,
        completedProfiles
      ] = await Promise.all([
        Invitation.countDocuments(),
        Invitation.countDocuments({ createdAt: { $gte: today } }),
        Invitation.countDocuments({ createdAt: { $gte: weekAgo } }),
        Invitation.countDocuments({ status: 'accepted' }),
        Match.countDocuments(),
        Match.countDocuments({ createdAt: { $gte: today } }),
        ProfessionalProfile.countDocuments({ 
          $and: [
            { company: { $exists: true, $ne: '' } },
            { position: { $exists: true, $ne: '' } },
            { industry: { $exists: true, $ne: '' } }
          ]
        })
      ]);

      const acceptanceRate = totalInvitations > 0 ? (acceptedInvitations / totalInvitations * 100) : 0;

      return {
        totalInvitations,
        invitationsPerPeriod: {
          today: invitationsToday,
          week: invitationsWeek
        },
        acceptedInvitations,
        acceptanceRate: Math.round(acceptanceRate),
        totalMatches,
        matchesToday,
        completedProfiles
      };
    } catch (error) {
      console.error('Error fetching professional metrics:', error);
      throw error;
    }
  }

  // System Health Metrics
  static async getSystemHealthMetrics() {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent activity indicators
      const [
        recentMessages,
        recentLogins,
        recentInvitations
      ] = await Promise.all([
        Message.countDocuments({ createdAt: { $gte: hourAgo } }),
        User.countDocuments({ lastActive: { $gte: hourAgo } }),
        Invitation.countDocuments({ createdAt: { $gte: hourAgo } })
      ]);

      return {
        systemStatus: 'healthy', // Could be enhanced with actual health checks
        recentActivity: {
          messages: recentMessages,
          logins: recentLogins,
          invitations: recentInvitations
        },
        timestamp: now
      };
    } catch (error) {
      console.error('Error fetching system health metrics:', error);
      throw error;
    }
  }

  // Top Industries and Universities
  static async getTopCategories() {
    try {
      const [topIndustries, topUniversities] = await Promise.all([
        ProfessionalProfile.aggregate([
          { $match: { industry: { $exists: true, $ne: '' } } },
          { $group: { _id: '$industry', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { name: '$_id', count: 1, _id: 0 } }
        ]),
        User.aggregate([
          { $match: { education: { $exists: true, $ne: '' }, userType: 'seeker' } },
          { $group: { _id: '$education', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { name: '$_id', count: 1, _id: 0 } }
        ])
      ]);

      return {
        topIndustries,
        topUniversities
      };
    } catch (error) {
      console.error('Error fetching top categories:', error);
      throw error;
    }
  }

  // Real-time Analytics Update
  static async getRealTimeMetrics() {
    try {
      const [
        userGrowth,
        messaging,
        professional,
        systemHealth,
        categories
      ] = await Promise.all([
        this.getUserGrowthMetrics(),
        this.getMessagingMetrics(),
        this.getProfessionalMetrics(),
        this.getSystemHealthMetrics(),
        this.getTopCategories()
      ]);

      return {
        userGrowth,
        messaging,
        professional,
        systemHealth,
        categories,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  // User Activity Timeline (for charts)
  static async getUserActivityTimeline(days = 7) {
    try {
      const timeline = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

        const [newUsers, activeUsers, messages, invitations] = await Promise.all([
          User.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
          User.countDocuments({ lastActive: { $gte: startOfDay, $lte: endOfDay } }),
          Message.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
          Invitation.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } })
        ]);

        timeline.push({
          date: startOfDay.toISOString().split('T')[0],
          newUsers,
          activeUsers,
          messages,
          invitations
        });
      }

      return timeline;
    } catch (error) {
      console.error('Error fetching user activity timeline:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService; 