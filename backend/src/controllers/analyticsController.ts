import { Response } from 'express';
import Student from '../models/student';
import User from '../models/user';
import { AuthRequest } from '../middlewares/authMiddleware';

// Sigmoid-like formula for Winning Probability based on Expected Vote Share
const calculateWinningProbability = (expectedVoteShare: number): number => {
  if (expectedVoteShare <= 0) return 0;
  if (expectedVoteShare >= 100) return 100;
  // Logistic function centered at 50% vote share
  const prob = 1 / (1 + Math.exp(-0.35 * (expectedVoteShare - 50)));
  return Math.round(prob * 100);
};

// GET /api/analytics/dashboard
export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalContacted = await Student.countDocuments({ contactStatus: 'Contacted' });
    const remainingContacts = await Student.countDocuments({ contactStatus: { $ne: 'Contacted' } });
    
    const confirmedSupporters = await Student.countDocuments({ supportStatus: 'Fully in our favour' });
    const leaningSupporters = await Student.countDocuments({ supportStatus: 'Leaning towards us' });
    const diceyVoters = await Student.countDocuments({ supportStatus: 'Dicey' });
    const opponents = await Student.countDocuments({ supportStatus: 'Against us' });
    const totalVotesCast = await Student.countDocuments({ voteStatus: 'Voted' });

    // Predicted votes = sum of probability scores (as a percentage, so score/100)
    const pipelineResult = await Student.aggregate([
      {
        $group: {
          _id: null,
          predictedVotes: { $sum: { $divide: ['$probabilityScore', 100] } },
        },
      },
    ]);

    const predictedVotes = pipelineResult.length > 0 ? Math.round(pipelineResult[0].predictedVotes) : 0;
    const expectedVoteShare = totalStudents > 0 ? parseFloat(((predictedVotes / totalStudents) * 100).toFixed(1)) : 0;
    const winningProbability = calculateWinningProbability(expectedVoteShare);

    return res.json({
      totalStudents,
      totalContacted,
      remainingContacts,
      confirmedSupporters: confirmedSupporters + leaningSupporters, // Confirmed + Leaning
      diceyVoters,
      opponents,
      predictedVotes,
      expectedVoteShare,
      winningProbability,
      totalVotesCast,
    });
  } catch (error) {
    console.error('getDashboardAnalytics error:', error);
    return res.status(500).json({ message: 'Error retrieving analytics' });
  }
};

// GET /api/analytics/departments
export const getDepartmentAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const agg = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          totalStudents: { $sum: 1 },
          contacted: {
            $sum: { $cond: [{ $eq: ['$contactStatus', 'Contacted'] }, 1, 0] },
          },
          fullyInFavour: {
            $sum: { $cond: [{ $eq: ['$supportStatus', 'Fully in our favour'] }, 1, 0] },
          },
          leaning: {
            $sum: { $cond: [{ $eq: ['$supportStatus', 'Leaning towards us'] }, 1, 0] },
          },
          dicey: {
            $sum: { $cond: [{ $eq: ['$supportStatus', 'Dicey'] }, 1, 0] },
          },
          against: {
            $sum: { $cond: [{ $eq: ['$supportStatus', 'Against us'] }, 1, 0] },
          },
          unknown: {
            $sum: { $cond: [{ $eq: ['$supportStatus', 'Unknown'] }, 1, 0] },
          },
          predictedVotesSum: { $sum: { $divide: ['$probabilityScore', 100] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const departments = agg.map((d) => {
      const supportPercent = d.totalStudents > 0 ? Math.round(((d.fullyInFavour + d.leaning) / d.totalStudents) * 100) : 0;
      const contactedPercent = d.totalStudents > 0 ? Math.round((d.contacted / d.totalStudents) * 100) : 0;
      const diceyPercent = d.totalStudents > 0 ? Math.round((d.dicey / d.totalStudents) * 100) : 0;
      const oppositionPercent = d.totalStudents > 0 ? Math.round((d.against / d.totalStudents) * 100) : 0;
      const predictedVotes = Math.round(d.predictedVotesSum);
      const expectedShare = d.totalStudents > 0 ? (predictedVotes / d.totalStudents) * 100 : 0;
      const winningProbability = calculateWinningProbability(expectedShare);

      return {
        name: d._id || 'Unknown Department',
        totalStudents: d.totalStudents,
        contacted: d.contacted,
        contactedPercent,
        supportPercent,
        diceyPercent,
        oppositionPercent,
        predictedVotes,
        winningProbability,
      };
    });

    return res.json(departments);
  } catch (error) {
    console.error('getDepartmentAnalytics error:', error);
    return res.status(500).json({ message: 'Error retrieving department analytics' });
  }
};

// GET /api/analytics/priority-list
export const getPriorityVoterList = async (req: AuthRequest, res: Response) => {
  try {
    // 1. High probability supporters not contacted yet
    const highProbNotContacted = await Student.find({
      supportStatus: { $in: ['Fully in our favour', 'Leaning towards us'] },
      contactStatus: 'Not Contacted',
    })
      .limit(15)
      .populate('assignedVolunteer', 'username');

    // 2. Dicey voters requiring follow-up
    const diceyRequireFollowUp = await Student.find({
      supportStatus: 'Dicey',
      contactStatus: 'Follow-up Required',
    })
      .limit(15)
      .populate('assignedVolunteer', 'username');

    // 3. Influential students (CR positions, Club leaders, etc.)
    const influentialStudents = await Student.find({
      influenceScore: { $gt: 20 },
    })
      .sort({ influenceScore: -1 })
      .limit(15)
      .populate('assignedVolunteer', 'username');

    return res.json({
      highProbNotContacted,
      diceyRequireFollowUp,
      influentialStudents,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving priority lists' });
  }
};

// GET /api/volunteers/performance
export const getVolunteerPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const volunteers = await User.find({ role: 'Volunteer' }).select('username');
    const performanceList = [];

    for (const volunteer of volunteers) {
      const assignedCount = await Student.countDocuments({ assignedVolunteer: volunteer._id });
      const contactedCount = await Student.countDocuments({
        assignedVolunteer: volunteer._id,
        contactStatus: 'Contacted',
      });
      const supportersGenerated = await Student.countDocuments({
        assignedVolunteer: volunteer._id,
        supportStatus: { $in: ['Fully in our favour', 'Leaning towards us'] },
      });

      const conversionRate = contactedCount > 0 ? Math.round((supportersGenerated / contactedCount) * 100) : 0;

      performanceList.push({
        id: volunteer._id,
        username: volunteer.username,
        assignedStudents: assignedCount,
        contactsCompleted: contactedCount,
        supportersGenerated,
        conversionRate,
      });
    }

    // Sort by supporters generated and then conversion rate to create leaderboard
    performanceList.sort((a, b) => b.supportersGenerated - a.supportersGenerated || b.conversionRate - a.conversionRate);

    return res.json(performanceList);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving volunteer performance' });
  }
};

// GET /api/analytics/heatmaps
export const getHeatmaps = async (req: AuthRequest, res: Response) => {
  try {
    const deptAgg = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          predicted: { $sum: { $divide: ['$probabilityScore', 100] } },
        },
      },
    ]);

    const departmentHeatmap = deptAgg.map((d) => {
      const predictedShare = d.total > 0 ? (d.predicted / d.total) * 100 : 0;
      let status: 'strong' | 'average' | 'weak' = 'average';
      if (predictedShare >= 60) status = 'strong';
      else if (predictedShare < 45) status = 'weak';

      return {
        department: d._id || 'Unknown',
        total: d.total,
        expectedVoteShare: Math.round(predictedShare),
        status,
      };
    }).sort((a, b) => a.expectedVoteShare - b.expectedVoteShare); // Ascending, so weak ones are listed first

    // Support distribution across hostels
    const hostelAgg = await Student.aggregate([
      {
        $group: {
          _id: '$hostel',
          total: { $sum: 1 },
          favourable: {
            $sum: {
              $cond: [
                { $in: ['$supportStatus', ['Fully in our favour', 'Leaning towards us']] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const hostelHeatmap = hostelAgg.map((h) => {
      const supportPercent = h.total > 0 ? Math.round((h.favourable / h.total) * 100) : 0;
      return {
        hostel: h._id || 'Day Scholar / Unknown',
        totalStudents: h.total,
        supportPercent,
      };
    });

    return res.json({
      departments: departmentHeatmap,
      hostels: hostelHeatmap,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving heatmaps' });
  }
};
export default getDashboardAnalytics;
