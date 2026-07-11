export type Role = 'Admin' | 'Editor' | 'Marker' | 'Watcher';

export interface User {
  id: string;
  _id?: string;
  username: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export type ContactStatus = 'Contacted' | 'Not Contacted' | 'Follow-up Required';
export type SupportStatus = 'Fully in our favour' | 'Leaning towards us' | 'Dicey' | 'Against us' | 'Unknown';
export type VoteStatus = 'Voted' | 'Not Voted';

export interface Student {
  _id: string;
  name: string;
  admissionNumber: string;
  mobileNumber?: string;
  department: string;
  year: number;
  hostel?: string;
  contactStatus: ContactStatus;
  supportStatus: SupportStatus;
  voteStatus: VoteStatus;
  probabilityScore: number;
  influenceScore: number;
  assignedVolunteer?: User | null;
  remarks?: string;
  followUpDate?: string | null;
  lastContactDate?: string | null;
  votedAt?: string | null;
  votedMarkedBy?: User | null;
  isCR: boolean;
  isClubLeader: boolean;
  isHostelRep: boolean;
  isSportsCaptain: boolean;
  isEventOrganizer: boolean;
  isPopular: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalContacted: number;
  remainingContacts: number;
  confirmedSupporters: number;
  diceyVoters: number;
  opponents: number;
  predictedVotes: number;
  expectedVoteShare: number;
  winningProbability: number;
  totalVotesCast: number;
}

export interface DepartmentStats {
  name: string;
  totalStudents: number;
  contacted: number;
  contactedPercent: number;
  supportPercent: number;
  diceyPercent: number;
  oppositionPercent: number;
  predictedVotes: number;
  winningProbability: number;
}

export interface VolunteerPerformance {
  id: string;
  username: string;
  assignedStudents: number;
  contactsCompleted: number;
  supportersGenerated: number;
  conversionRate: number;
}

export interface Heatmaps {
  departments: Array<{
    department: string;
    total: number;
    expectedVoteShare: number;
    status: 'strong' | 'average' | 'weak';
  }>;
  hostels: Array<{
    hostel: string;
    totalStudents: number;
    supportPercent: number;
  }>;
}

export interface PriorityLists {
  highProbNotContacted: Student[];
  diceyRequireFollowUp: Student[];
  influentialStudents: Student[];
}
