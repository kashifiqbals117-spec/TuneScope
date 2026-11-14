import React, { useEffect, useState } from 'react';
import {
  Users2,
  HeartHandshake,
  Flame,
  Heart,
  Repeat,
  Sparkles,
  Zap,
  Plus,
  Trophy,
  Disc3,
  Search,
  Check,
} from 'lucide-react';
import { apiFetch } from '../utils/api.js';
import {
  FriendWithActivity,
  ActivityFeedItem,
  FriendGroup,
  LeaderboardEntry,
  ReactionType,
} from '@tunescope/shared';
import { GlassCard } from '../components/common/GlassCard.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { TasteComparisonModal } from '../components/social/TasteComparisonModal.js';
import { useSocket } from '../context/SocketContext.js';

export const Friends: React.FC = () => {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'leaderboards'>('feed');
  const [friends, setFriends] = useState<FriendWithActivity[]>([]);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [leaderboards, setLeaderboards] = useState<{
    weeklyMinutes: LeaderboardEntry[];
    diversityChampions: LeaderboardEntry[];
    topStreaks: LeaderboardEntry[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [comparingFriend, setComparingFriend] = useState<{ id: string; name: string } | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [friendsData, feedData, groupsData, lbData] = await Promise.all([
        apiFetch<FriendWithActivity[]>('/social/friends'),
        apiFetch<ActivityFeedItem[]>('/social/activity'),
        apiFetch<FriendGroup[]>('/social/groups'),
        apiFetch<any>('/social/leaderboards'),
      ]);
      setFriends(friendsData);
      setFeed(feedData);
      setGroups(groupsData);
      setLeaderboards(lbData);
    } catch (err) {
      console.error('Failed to load social data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for Socket.IO reaction updates
  useEffect(() => {
    if (!socket) return;

    socket.on('activity:reaction', (data: { trackId: string; reactionType: ReactionType; action: string }) => {
      setFeed((prevFeed) =>
        prevFeed.map((item) => {
          if (item.trackId === data.trackId) {
            const currentCount = item.reactions[data.reactionType] || 0;
            return {
              ...item,
              reactions: {
                ...item.reactions,
                [data.reactionType]: data.action === 'added' ? currentCount + 1 : Math.max(0, currentCount - 1),
              },
            };
          }
          return item;
        })
      );
    });

    return () => {
      socket.off('activity:reaction');
    };
  }, [socket]);

  const handleReaction = async (trackId: string, reactionType: ReactionType) => {
    try {
      // Optimistic update
      setFeed((prev) =>
        prev.map((item) => {
          if (item.trackId === trackId) {
            const isCurrent = item.userReaction === reactionType;
            const newCount = (item.reactions[reactionType] || 0) + (isCurrent ? -1 : 1);
            return {
              ...item,
              userReaction: isCurrent ? null : reactionType,
              reactions: {
                ...item.reactions,
                [reactionType]: Math.max(0, newCount),
              },
            };
          }
          return item;
        })
      );

      await apiFetch('/social/reactions', {
        method: 'POST',
        body: JSON.stringify({ trackId, reactionType }),
      });
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      loadData();
    }
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await apiFetch<any[]>(`/social/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const sendFriendRequest = async (username: string) => {
    try {
      setRequestStatus(null);
      await apiFetch('/social/friends/request', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: username }),
      });
      setRequestStatus(`Request sent to @${username}!`);
      setTimeout(() => {
        setShowAddFriendModal(false);
        setRequestStatus(null);
        setSearchQuery('');
        setSearchResults([]);
      }, 1500);
    } catch (err: any) {
      setRequestStatus(err.message || 'Failed to send request');
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await apiFetch('/social/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
      });
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadData();
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const reactionIcons: Record<ReactionType, { icon: any; color: string }> = {
    FIRE: { icon: Flame, color: 'text-amber-500' },
    LOVE: { icon: Heart, color: 'text-rose-500' },
    REPEAT: { icon: Repeat, color: 'text-cyan-400' },
    VIBE: { icon: Sparkles, color: 'text-purple-400' },
    MIND_BLOWN: { icon: Zap, color: 'text-emerald-400' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Social & Community</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time activity feed, song reactions, friend groups, and taste matchmaking.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddFriendModal(true)}
          >
            Add Friend
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={<Users2 className="w-4 h-4" />}
            onClick={() => setShowCreateGroupModal(true)}
          >
            New Circle
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 space-x-6 text-sm font-semibold text-slate-400">
        {(['feed', 'friends', 'groups', 'leaderboards'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition relative ${
              activeTab === tab
                ? 'text-brand-emerald border-b-2 border-brand-emerald'
                : 'hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Live Activity Feed with Song Reactions */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-24 text-center">
              <Disc3 className="w-10 h-10 text-brand-emerald animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Listening to friend activity...</p>
            </div>
          ) : feed.length === 0 ? (
            <GlassCard className="py-16 text-center text-slate-400">
              <Users2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold">No activity to show</p>
              <p className="text-xs text-slate-500 mt-1">Add friends or invite classmates to join!</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.map((item) => (
                <GlassCard key={item.id} hoverEffect className="space-y-4">
                  {/* User info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={item.displayName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{item.displayName}</p>
                        <span className="text-[10px] text-slate-400">@{item.username}</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500">
                      {new Date(item.playedAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Track info */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-dark-900/90 border border-white/5">
                    <img
                      src={item.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'}
                      alt={item.trackTitle}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{item.trackTitle}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.artistName}</p>
                    </div>
                  </div>

                  {/* Real-time Emoji Reactions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-slate-400 font-medium">Reactions</span>
                    <div className="flex items-center gap-1.5">
                      {(['FIRE', 'LOVE', 'REPEAT', 'VIBE', 'MIND_BLOWN'] as ReactionType[]).map((rType) => {
                        const { icon: Icon, color } = reactionIcons[rType];
                        const count = item.reactions[rType] || 0;
                        const isSelected = item.userReaction === rType;

                        return (
                          <button
                            key={rType}
                            onClick={() => handleReaction(item.trackId, rType)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-white/15 text-white ring-1 ring-white/30'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                            {count > 0 && <span className="text-[10px]">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Friends List & Taste Match */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <GlassCard key={friend.id} hoverEffect className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={friend.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={friend.displayName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-dark-900" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{friend.displayName}</h3>
                    <p className="text-xs text-brand-emerald truncate">
                      {friend.persona || 'Electronic Purist'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Currently listening */}
              {friend.currentlyListening ? (
                <div className="p-3 rounded-xl bg-dark-900/90 border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Recently Vibing To
                  </span>
                  <p className="text-xs font-semibold text-white truncate">
                    {friend.currentlyListening.trackTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {friend.currentlyListening.artistName}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-dark-900/50 text-xs text-slate-500">
                  Not listening currently
                </div>
              )}

              {/* Compare taste action */}
              <button
                onClick={() => setComparingFriend({ id: friend.id, name: friend.displayName })}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:border-cyan-500/40 transition"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />
                Compare Music Taste
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Tab 3: Friend Groups / Listening Circles */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <GlassCard key={group.id} hoverEffect className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-violet bg-purple-500/10 px-2.5 py-1 rounded-md">
                  Listening Circle
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{group.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {group.description || 'Community listening and taste collaboration circle.'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-xs font-semibold text-slate-300">
                  Circle Members ({group.memberCount})
                </p>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {group.members.map((m) => (
                    <img
                      key={m.userId}
                      src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={m.displayName}
                      title={m.displayName}
                      className="inline-block w-8 h-8 rounded-full ring-2 ring-dark-900 object-cover"
                    />
                  ))}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Tab 4: Leaderboards */}
      {activeTab === 'leaderboards' && leaderboards && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Weekly Listening Champions</h3>
            </div>

            <div className="divide-y divide-white/5">
              {leaderboards.weeklyMinutes.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 text-sm font-black text-center ${
                        entry.rank === 1
                          ? 'text-amber-400'
                          : entry.rank === 2
                          ? 'text-slate-300'
                          : entry.rank === 3
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      #{entry.rank}
                    </span>
                    <img
                      src={entry.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={entry.displayName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{entry.displayName}</p>
                      <span className="text-[10px] text-slate-400">{entry.badge}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-brand-emerald">
                      {entry.metricValue}m
                    </span>
                    <span className="text-[10px] text-slate-400 block">this week</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-cyan" />
              <h3 className="text-base font-bold text-white">Genre Diversity Pioneers</h3>
            </div>

            <div className="divide-y divide-white/5">
              {leaderboards.diversityChampions.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm font-black text-slate-500 text-center">
                      #{entry.rank}
                    </span>
                    <img
                      src={entry.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={entry.displayName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{entry.displayName}</p>
                      <span className="text-[10px] text-brand-cyan">{entry.badge}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-cyan-400">
                      {entry.metricValue}
                    </span>
                    <span className="text-[10px] text-slate-400 block">genres explored</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Taste Comparison Modal */}
      {comparingFriend && (
        <TasteComparisonModal
          friendId={comparingFriend.id}
          friendName={comparingFriend.name}
          onClose={() => setComparingFriend(null)}
        />
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Music Friend</h3>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Search by username or email to send a friend request.
            </p>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                placeholder="Type username (e.g. sarah_beats)..."
                className="w-full bg-dark-950 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-emerald"
              />
            </div>

            {requestStatus && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                {requestStatus}
              </p>
            )}

            <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={u.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{u.displayName}</p>
                      <p className="text-[10px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => sendFriendRequest(u.username)}
                  >
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Listening Circle</h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Form a music circle to track shared listening leaderboards and taste alignment.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Circle Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Midnight Vinyl Club"
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-emerald"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Description</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="What brings this circle together?"
                  rows={3}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-emerald"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowCreateGroupModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={createGroup}>
                Create Circle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

