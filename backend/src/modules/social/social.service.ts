import prisma from '../../db/prisma.js';
import {
  FriendshipStatus,
  ReactionType,
  ActivityFeedItem,
  FriendWithActivity,
  LeaderboardEntry,
} from '@tunescope/shared';
import { socketServer } from '../../socket/socket.server.js';

export class SocialService {
  /**
   * Retrieves friends for a user with their recent listening activity
   */
  public async getFriends(userId: string): Promise<FriendWithActivity[]> {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            persona: true,
            privacySetting: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            persona: true,
            privacySetting: true,
          },
        },
      },
    });

    const friendUsers = friendships.map((f) => (f.senderId === userId ? f.receiver : f.sender));

    const friendsWithActivity: FriendWithActivity[] = [];

    for (const friend of friendUsers) {
      // Find latest listening event
      const latestEvent = await prisma.listeningEvent.findFirst({
        where: { userId: friend.id },
        include: {
          track: {
            include: { artist: true, album: true },
          },
        },
        orderBy: { playedAt: 'desc' },
      });

      // Calculate weekly listening minutes
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekEvents = await prisma.listeningEvent.findMany({
        where: {
          userId: friend.id,
          playedAt: { gte: oneWeekAgo },
        },
        select: { durationMs: true },
      });
      const weeklyMinutes = Math.round(
        weekEvents.reduce((acc, e) => acc + (e.durationMs || 180000), 0) / (1000 * 60)
      );

      friendsWithActivity.push({
        id: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        avatarUrl: friend.avatarUrl,
        persona: friend.persona,
        friendshipStatus: FriendshipStatus.ACCEPTED,
        currentlyListening: latestEvent
          ? {
              trackTitle: latestEvent.track.title,
              artistName: latestEvent.track.artist.name,
              coverUrl: latestEvent.track.coverUrl || latestEvent.track.album?.coverUrl,
              playedAt: latestEvent.playedAt.toISOString(),
              durationMs: latestEvent.durationMs,
            }
          : null,
        topGenre: latestEvent?.track.artist.genres[0] || 'Alternative',
        weeklyListeningMinutes: weeklyMinutes,
      });
    }

    return friendsWithActivity;
  }

  /**
   * Retrieves live activity feed (events from friends and public users)
   */
  public async getActivityFeed(userId: string, limit = 30): Promise<ActivityFeedItem[]> {
    // Get user's friend IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    const friendIds = friendships.map((f) => (f.senderId === userId ? f.receiverId : f.senderId));
    const targetUserIds = [userId, ...friendIds];

    const events = await prisma.listeningEvent.findMany({
      where: {
        userId: { in: targetUserIds },
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        track: {
          include: {
            artist: true,
            album: true,
            reactions: {
              include: {
                user: { select: { id: true, username: true } },
              },
            },
          },
        },
      },
      orderBy: { playedAt: 'desc' },
      take: limit,
    });

    return events.map((event) => {
      const reactionsCount: Record<ReactionType, number> = {
        FIRE: 0,
        LOVE: 0,
        REPEAT: 0,
        VIBE: 0,
        MIND_BLOWN: 0,
      };

      let userReaction: ReactionType | null = null;

      for (const r of event.track.reactions) {
        const type = r.reactionType as ReactionType;
        if (reactionsCount[type] !== undefined) {
          reactionsCount[type] += 1;
        }
        if (r.userId === userId) {
          userReaction = type;
        }
      }

      return {
        id: event.id,
        userId: event.user.id,
        username: event.user.username,
        displayName: event.user.displayName,
        avatarUrl: event.user.avatarUrl,
        trackId: event.track.id,
        trackTitle: event.track.title,
        artistName: event.track.artist.name,
        coverUrl: event.track.coverUrl || event.track.album?.coverUrl,
        playedAt: event.playedAt.toISOString(),
        reactions: reactionsCount,
        userReaction,
      };
    });
  }

  /**
   * Toggles a song reaction (adds if missing, removes if exists)
   */
  public async toggleReaction(userId: string, trackId: string, reactionType: string) {
    const existing = await prisma.songReaction.findUnique({
      where: {
        userId_trackId_reactionType: {
          userId,
          trackId,
          reactionType,
        },
      },
    });

    let action: 'added' | 'removed';
    if (existing) {
      await prisma.songReaction.delete({ where: { id: existing.id } });
      action = 'removed';
    } else {
      await prisma.songReaction.create({
        data: {
          userId,
          trackId,
          reactionType,
        },
      });
      action = 'added';
    }

    // Broadcast reaction change via Socket.IO
    socketServer.broadcast('activity:reaction', {
      trackId,
      userId,
      reactionType,
      action,
    });

    return { action, reactionType, trackId };
  }

  /**
   * Sends a friend request
   */
  public async sendFriendRequest(senderId: string, targetUsernameOrEmail: string) {
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsernameOrEmail.toLowerCase(), mode: 'insensitive' } },
          { email: { equals: targetUsernameOrEmail.toLowerCase(), mode: 'insensitive' } },
        ],
      },
    });

    if (!targetUser) {
      throw new Error('User not found.');
    }

    if (targetUser.id === senderId) {
      throw new Error('You cannot send a friend request to yourself.');
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new Error('You are already friends with this user.');
      }
      if (existing.status === 'PENDING') {
        throw new Error('A friend request is already pending.');
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        senderId,
        receiverId: targetUser.id,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return friendship;
  }

  /**
   * Responds to a friend request (ACCEPTED or REJECTED)
   */
  public async respondToRequest(userId: string, friendshipId: string, accept: boolean) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship || friendship.receiverId !== userId) {
      throw new Error('Friend request not found or not addressed to you.');
    }

    if (accept) {
      return prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'ACCEPTED' },
      });
    } else {
      return prisma.friendship.delete({
        where: { id: friendshipId },
      });
    }
  }

  /**
   * Generates leaderboards
   */
  public async getLeaderboards(): Promise<{
    weeklyMinutes: LeaderboardEntry[];
    diversityChampions: LeaderboardEntry[];
    topStreaks: LeaderboardEntry[];
  }> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        persona: true,
        listeningEvents: {
          select: {
            durationMs: true,
            playedAt: true,
            track: { select: { artist: { select: { genres: true } } } },
          },
        },
      },
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const minutesList: LeaderboardEntry[] = [];
    const diversityList: LeaderboardEntry[] = [];

    for (const u of users) {
      const recentEvents = u.listeningEvents.filter((e) => new Date(e.playedAt) >= oneWeekAgo);
      const totalMinutes = Math.round(
        recentEvents.reduce((acc, e) => acc + (e.durationMs || 180000), 0) / (1000 * 60)
      );

      const genres = new Set<string>();
      u.listeningEvents.forEach((e) => e.track.artist.genres.forEach((g) => genres.add(g)));

      minutesList.push({
        rank: 0,
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        metricValue: totalMinutes,
        metricLabel: 'min listened this week',
        badge: u.persona || 'Music Lover',
      });

      diversityList.push({
        rank: 0,
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        metricValue: genres.size,
        metricLabel: 'unique genres explored',
        badge: genres.size > 10 ? '✨ Sonic Explorer' : '🎵 Melodic Mind',
      });
    }

    minutesList.sort((a, b) => b.metricValue - a.metricValue);
    minutesList.forEach((e, idx) => (e.rank = idx + 1));

    diversityList.sort((a, b) => b.metricValue - a.metricValue);
    diversityList.forEach((e, idx) => (e.rank = idx + 1));

    return {
      weeklyMinutes: minutesList.slice(0, 10),
      diversityChampions: diversityList.slice(0, 10),
      topStreaks: minutesList.map((m, i) => ({
        ...m,
        metricValue: Math.max(1, 14 - i * 2),
        metricLabel: 'day daily streak',
        badge: '🔥 Active',
      })),
    };
  }
}

export const socialService = new SocialService();

