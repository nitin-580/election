'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { VolunteerPerformance } from '../../../types';
import { Award, Users, CheckCircle, Flame, Star, Trophy } from 'lucide-react';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<VolunteerPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const res = await api.get<VolunteerPerformance[]>('/analytics/volunteers/performance');
      setVolunteers(res.data);
    } catch (err) {
      console.error('Error fetching volunteer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Get podium awards for rankings
  const getPodiumBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5.5 w-5.5 text-amber-500 fill-amber-500/20" />;
      case 1:
        return <Award className="h-5.5 w-5.5 text-slate-400 fill-slate-400/20" />;
      case 2:
        return <Award className="h-5.5 w-5.5 text-amber-700 fill-amber-700/20" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-5.5 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Volunteer Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time stats and performance metrics of campaign field workers.</p>
      </div>

      {/* Podium grid if there are at least 3 volunteers */}
      {volunteers.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-end">
          {/* 2nd Place */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col items-center text-center order-2 md:order-1 h-[200px] justify-center relative">
            <span className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-400/10 text-slate-400">
              <Award className="h-5 w-5" />
            </span>
            <div className="h-12 w-12 rounded-full bg-slate-450/20 text-slate-450 border border-slate-400/30 flex items-center justify-center font-bold text-lg mb-3">
              {volunteers[1].username[0].toUpperCase()}
            </div>
            <h3 className="font-bold text-sm truncate max-w-[150px]">{volunteers[1].username}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Rank #2</p>
            <div className="mt-2 text-xs font-semibold text-primary">{volunteers[1].supportersGenerated} Supporters Generated</div>
          </div>

          {/* 1st Place */}
          <div className="rounded-2xl border-2 border-amber-500 bg-card p-6 shadow-md shadow-amber-500/5 flex flex-col items-center text-center order-1 md:order-2 h-[230px] justify-center relative transform hover:-translate-y-1 transition-transform">
            <span className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Trophy className="h-6 w-6" />
            </span>
            <div className="h-16 w-16 rounded-full bg-amber-500/15 text-amber-500 border-2 border-amber-500 flex items-center justify-center font-extrabold text-2xl mb-3 shadow-lg shadow-amber-500/10">
              {volunteers[0].username[0].toUpperCase()}
            </div>
            <h3 className="font-bold text-base truncate max-w-[180px]">{volunteers[0].username}</h3>
            <p className="text-xs text-amber-500 font-semibold mt-0.5">Grand Campaigner #1</p>
            <div className="mt-3 text-sm font-bold text-primary">{volunteers[0].supportersGenerated} Supporters Generated</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{volunteers[0].contactsCompleted} Outreach Contacts Complete</div>
          </div>

          {/* 3rd Place */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col items-center text-center order-3 h-[180px] justify-center relative">
            <span className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/10 text-amber-700">
              <Award className="h-5 w-5" />
            </span>
            <div className="h-12 w-12 rounded-full bg-amber-700/20 text-amber-700 border border-amber-700/30 flex items-center justify-center font-bold text-lg mb-3">
              {volunteers[2].username[0].toUpperCase()}
            </div>
            <h3 className="font-bold text-sm truncate max-w-[150px]">{volunteers[2].username}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Rank #3</p>
            <div className="mt-2 text-xs font-semibold text-primary">{volunteers[2].supportersGenerated} Supporters Generated</div>
          </div>
        </div>
      )}

      {/* Volunteer Grid List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold">Campaign Performance Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Complete breakdown of targets, contacts, and conversion rates.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12 text-center">Rank</th>
                <th className="px-6 py-4">Volunteer Username</th>
                <th className="px-6 py-4 text-center">Assigned Students</th>
                <th className="px-6 py-4 text-center">Contacts Completed</th>
                <th className="px-6 py-4 text-center">Supporters Generated</th>
                <th className="px-6 py-4 text-center">Conversion Rate</th>
                <th className="px-6 py-4 text-right">Outreach Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {volunteers.map((vol, index) => (
                <tr key={vol.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-center flex items-center justify-center">{getPodiumBadge(index)}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{vol.username}</td>
                  <td className="px-6 py-4 text-center font-medium">{vol.assignedStudents}</td>
                  <td className="px-6 py-4 text-center font-medium">
                    <span className="inline-flex items-center text-xs font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                      {vol.contactsCompleted}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold">
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {vol.supportersGenerated}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5 font-bold">
                      <Flame className="h-4.5 w-4.5 text-amber-500" />
                      <span>{vol.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="w-32 ml-auto">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, Math.round((vol.contactsCompleted / (vol.assignedStudents || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {volunteers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No volunteer performance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
