'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { DashboardStats, DepartmentStats, PriorityLists, Heatmaps } from '../../types';
import {
  Users,
  CheckCircle,
  Clock,
  UserCheck,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  Percent,
  CheckSquare,
  UsersRound,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [priorityLists, setPriorityLists] = useState<PriorityLists | null>(null);
  const [heatmaps, setHeatmaps] = useState<Heatmaps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, deptRes, priorityRes, heatmapRes] = await Promise.all([
          api.get<DashboardStats>('/analytics/dashboard'),
          api.get<DepartmentStats[]>('/analytics/departments'),
          api.get<PriorityLists>('/analytics/priority-list'),
          api.get<Heatmaps>('/analytics/heatmaps'),
        ]);
        setStats(statsRes.data);
        setDepartments(deptRes.data);
        setPriorityLists(priorityRes.data);
        setHeatmaps(heatmapRes.data);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Cards layout
  const cards = stats
    ? [
        { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
        { title: 'Total Contacted', value: stats.totalContacted, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
        { title: 'Remaining Contacts', value: stats.remainingContacts, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
        { title: 'Confirmed Supporters', value: stats.confirmedSupporters, icon: UserCheck, color: 'text-teal-500 bg-teal-500/10' },
        { title: 'Dicey Voters', value: stats.diceyVoters, icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10' },
        { title: 'Opponents', value: stats.opponents, icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10' },
        { title: 'Predicted Votes', value: stats.predictedVotes, icon: TrendingUp, color: 'text-indigo-500 bg-indigo-500/10' },
        { title: 'Expected Vote Share', value: `${stats.expectedVoteShare}%`, icon: Percent, color: 'text-violet-500 bg-violet-500/10' },
        { title: 'Winning Probability', value: `${stats.winningProbability}%`, icon: TrophyIcon, color: 'text-cyan-500 bg-cyan-500/10' },
        { title: 'Total Votes Cast', value: stats.totalVotesCast, icon: CheckSquare, color: 'text-orange-500 bg-orange-500/10' },
      ]
    : [];

  const pieData = stats
    ? [
        { name: 'Support', value: stats.confirmedSupporters, color: '#10b981' },
        { name: 'Dicey', value: stats.diceyVoters, color: '#f59e0b' },
        { name: 'Against', value: stats.opponents, color: '#ef4444' },
        { name: 'Remaining / Unknown', value: Math.max(0, stats.totalStudents - (stats.confirmedSupporters + stats.diceyVoters + stats.opponents)), color: '#94a3b8' },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Campaign Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time voter tracking, department analysis, and prediction engine.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.title}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Key Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Breakdown Pie Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Outreach Distribution</h2>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground truncate">{item.name}: <strong className="text-foreground">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Expected Vote Share Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold mb-4">Department-wise Expected Support Share</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} stroke="var(--muted-foreground)" />
                <YAxis unit="%" stroke="var(--muted-foreground)" />
                <Tooltip formatter={(value) => [`${value}%`, 'Expected Support']} />
                <Bar dataKey="supportPercent" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department-Wise Analysis Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold">Department Wise Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Summary of campaign strengths and predictions by department.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold text-center">Total Students</th>
                <th className="px-6 py-4 font-semibold text-center">Contacted %</th>
                <th className="px-6 py-4 font-semibold text-center">Support %</th>
                <th className="px-6 py-4 font-semibold text-center">Dicey %</th>
                <th className="px-6 py-4 font-semibold text-center">Opposition %</th>
                <th className="px-6 py-4 font-semibold text-center">Predicted Votes</th>
                <th className="px-6 py-4 font-semibold text-center">Winning Prob</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((dept, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-semibold">{dept.name}</td>
                  <td className="px-6 py-4 text-center">{dept.totalStudents}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-500">
                      {dept.contactedPercent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                      {dept.supportPercent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500">
                      {dept.diceyPercent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-500">
                      {dept.oppositionPercent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">{dept.predictedVotes}</td>
                  <td className="px-6 py-4 text-center font-bold">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ${
                      dept.winningProbability >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                      dept.winningProbability >= 40 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {dept.winningProbability}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intelligence Priority lists */}
      {priorityLists && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Priority Support List */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                Uncontacted Supporters
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase">High Priority</span>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto pr-1">
              {priorityLists.highProbNotContacted.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No uncontacted supporters remaining.</p>
              ) : (
                priorityLists.highProbNotContacted.map((s) => (
                  <div key={s._id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.department} · Yr {s.year}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-500">{s.probabilityScore}% Prob</span>
                      <p className="text-[9px] text-muted-foreground">{s.hostel || 'Hostel N/A'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dicey Follow up List */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Dicey Follow-ups
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold uppercase">Requires Action</span>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto pr-1">
              {priorityLists.diceyRequireFollowUp.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No pending dicey follow-ups.</p>
              ) : (
                priorityLists.diceyRequireFollowUp.map((s) => (
                  <div key={s._id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.department} · Vol: {s.assignedVolunteer?.username || 'None'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-500">{s.contactStatus}</span>
                      <p className="text-[9px] text-muted-foreground">{s.followUpDate ? new Date(s.followUpDate).toLocaleDateString() : 'No date'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Influential Students */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-indigo-500" />
                Influential Students
              </h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-bold uppercase">Opinion Leaders</span>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto pr-1">
              {priorityLists.influentialStudents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No influential student data.</p>
              ) : (
                priorityLists.influentialStudents.map((s) => (
                  <div key={s._id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.department} · {s.hostel}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-500">Score: {s.influenceScore}</span>
                      <p className="text-[9px] text-muted-foreground">
                        {[
                          s.isCR && 'CR',
                          s.isClubLeader && 'Leader',
                          s.isHostelRep && 'Rep',
                          s.isSportsCaptain && 'Capt',
                          s.isEventOrganizer && 'Org',
                          s.isPopular && 'Popular',
                        ].filter(Boolean).slice(0, 2).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Heatmaps & Weak Departments */}
      {heatmaps && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weak Departments Warning Area */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
              Weak Departments (Action Required)
            </h3>
            <div className="space-y-4">
              {heatmaps.departments.filter(d => d.status === 'weak').map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                  <div>
                    <h4 className="font-semibold text-sm">{dept.department}</h4>
                    <p className="text-xs text-muted-foreground">Voter pool: {dept.total} students</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-rose-500">{dept.expectedVoteShare}%</span>
                    <p className="text-[10px] text-rose-450 uppercase font-semibold">Expected Vote Share</p>
                  </div>
                </div>
              ))}
              {heatmaps.departments.filter(d => d.status === 'weak').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Outstanding! No weak departments flagged (&lt; 45% support).</p>
              )}
            </div>
          </div>

          {/* Hostel support heatmap list */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Hostel Support Heatmap</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {heatmaps.hostels.map((hostel, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{hostel.hostel} ({hostel.totalStudents} voters)</span>
                    <span>{hostel.supportPercent}% Support</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        hostel.supportPercent >= 60 ? 'bg-emerald-500' :
                        hostel.supportPercent >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${hostel.supportPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Trophy SVG icon inline wrapper
function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 1 6 6v1a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
    </svg>
  );
}
