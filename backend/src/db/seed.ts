import bcrypt from 'bcryptjs';
import prisma from './prisma.js';
import { recapsService } from '../modules/recaps/recaps.service.js';
import { RecapType } from '@tunescope/shared';

async function seed() {
  console.log('🌱 Starting TuneScope database seed...');

  // 1. Clean existing records in dependency order
  await prisma.songReaction.deleteMany({});
  await prisma.friendGroupMember.deleteMany({});
  await prisma.friendGroup.deleteMany({});
  await prisma.friendship.deleteMany({});
  await prisma.recap.deleteMany({});
  await prisma.listeningEvent.deleteMany({});
  await prisma.providerConnection.deleteMany({});
  await prisma.track.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.artist.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing tables.');

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('tunescope2026', salt);

  const alex = await prisma.user.create({
    data: {
      email: 'alex@tunescope.app',
      passwordHash,
      username: 'alex_music',
      displayName: 'Alex Mercer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      bio: 'Synthesizing frequencies & late night electronic grooves. 🌌',
      persona: 'The Cosmic Explorer',
      privacySetting: 'PUBLIC',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@tunescope.app',
      passwordHash,
      username: 'sarah_beats',
      displayName: 'Sarah Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
      bio: 'Analog synths, 909 kicks, and endless polyrhythms. 🎛️',
      persona: 'The Electronic Purist',
      privacySetting: 'PUBLIC',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: 'marcus@tunescope.app',
      passwordHash,
      username: 'marcus_v',
      displayName: 'Marcus Vance',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      bio: 'Guitar riffs, vinyl pressings, and 2000s indie rock nostalgia. 🎸',
      persona: 'The Indie Nostalgist',
      privacySetting: 'PUBLIC',
    },
  });

  const elena = await prisma.user.create({
    data: {
      email: 'elena@tunescope.app',
      passwordHash,
      username: 'elena_vocal',
      displayName: 'Elena Rostova',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      bio: 'Chasing soaring vocals, cinematic crescendos, and art pop. ✨',
      persona: 'The Vocal Powerhouse',
      privacySetting: 'PUBLIC',
    },
  });

  console.log('👤 Created demo users: Alex, Sarah, Marcus, Elena.');

  // 3. Friendships
  await prisma.friendship.createMany({
    data: [
      { senderId: alex.id, receiverId: sarah.id, status: 'ACCEPTED' },
      { senderId: alex.id, receiverId: marcus.id, status: 'ACCEPTED' },
      { senderId: alex.id, receiverId: elena.id, status: 'ACCEPTED' },
      { senderId: sarah.id, receiverId: marcus.id, status: 'ACCEPTED' },
    ],
  });

  // 4. Friend Groups
  const group1 = await prisma.friendGroup.create({
    data: {
      name: 'Late Night Synth Club',
      description: 'For lovers of midnight arpeggios, cyberpunk basslines, and retro-futuristic vibes.',
      creatorId: alex.id,
      members: {
        create: [
          { userId: alex.id },
          { userId: sarah.id },
          { userId: elena.id },
        ],
      },
    },
  });

  const group2 = await prisma.friendGroup.create({
    data: {
      name: 'Festival Crew 2026',
      description: 'Tracking lineup discoveries, road trip playlists, and live anthems.',
      creatorId: marcus.id,
      members: {
        create: [
          { userId: marcus.id },
          { userId: alex.id },
          { userId: sarah.id },
        ],
      },
    },
  });

  console.log('🤝 Formed friendships and friend groups.');

  // 5. Seed Artists, Albums & Tracks
  const artistsData = [
    {
      name: 'Daft Punk',
      genres: ['French House', 'Electronic', 'Synthpop', 'Disco'],
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
      popularity: 92,
      followers: 12500000,
      album: {
        title: 'Random Access Memories',
        releaseDate: '2013-05-17',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'Get Lucky', durationMs: 248000, danceability: 0.79, energy: 0.86, valence: 0.87, acousticness: 0.04, tempo: 116 },
        { title: 'Instant Crush', durationMs: 337000, danceability: 0.58, energy: 0.59, valence: 0.51, acousticness: 0.12, tempo: 110 },
        { title: 'Lose Yourself to Dance', durationMs: 353000, danceability: 0.83, energy: 0.67, valence: 0.68, acousticness: 0.08, tempo: 100 },
        { title: 'Giorgio by Moroder', durationMs: 544000, danceability: 0.65, energy: 0.72, valence: 0.45, acousticness: 0.15, tempo: 113 },
      ],
    },
    {
      name: 'Tame Impala',
      genres: ['Psychedelic Pop', 'Indie Rock', 'Synthpop', 'Alternative'],
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
      popularity: 88,
      followers: 9800000,
      album: {
        title: 'Currents',
        releaseDate: '2015-07-17',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'The Less I Know the Better', durationMs: 216000, danceability: 0.64, energy: 0.74, valence: 0.78, acousticness: 0.01, tempo: 117 },
        { title: 'Let It Happen', durationMs: 467000, danceability: 0.60, energy: 0.88, valence: 0.57, acousticness: 0.03, tempo: 125 },
        { title: 'Borderline', durationMs: 237000, danceability: 0.68, energy: 0.71, valence: 0.69, acousticness: 0.07, tempo: 122 },
      ],
    },
    {
      name: 'Fred again..',
      genres: ['UK Garage', 'Electronic', 'Ambient House', 'Dance'],
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      popularity: 85,
      followers: 4200000,
      album: {
        title: 'Actual Life 3',
        releaseDate: '2022-10-28',
        coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'Delilah (pull me out of this)', durationMs: 251000, danceability: 0.72, energy: 0.84, valence: 0.42, acousticness: 0.05, tempo: 134 },
        { title: 'Danielle (smile on my face)', durationMs: 201000, danceability: 0.69, energy: 0.78, valence: 0.53, acousticness: 0.11, tempo: 130 },
        { title: 'Bleu (better with time)', durationMs: 198000, danceability: 0.61, energy: 0.65, valence: 0.38, acousticness: 0.22, tempo: 128 },
      ],
    },
    {
      name: 'Dua Lipa',
      genres: ['Dance Pop', 'Nu-Disco', 'Pop'],
      imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop',
      popularity: 94,
      followers: 43000000,
      album: {
        title: 'Future Nostalgia',
        releaseDate: '2020-03-27',
        coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'Don’t Start Now', durationMs: 183000, danceability: 0.79, energy: 0.79, valence: 0.68, acousticness: 0.01, tempo: 124 },
        { title: 'Levitating', durationMs: 203000, danceability: 0.70, energy: 0.82, valence: 0.91, acousticness: 0.01, tempo: 103 },
        { title: 'Physical', durationMs: 193000, danceability: 0.65, energy: 0.84, valence: 0.75, acousticness: 0.02, tempo: 147 },
      ],
    },
    {
      name: 'The Weeknd',
      genres: ['R&B', 'Synthwave', 'Pop', 'Alternative R&B'],
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop',
      popularity: 96,
      followers: 65000000,
      album: {
        title: 'After Hours',
        releaseDate: '2020-03-20',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'Blinding Lights', durationMs: 200000, danceability: 0.51, energy: 0.73, valence: 0.33, acousticness: 0.001, tempo: 171 },
        { title: 'Save Your Tears', durationMs: 215000, danceability: 0.68, energy: 0.83, valence: 0.64, acousticness: 0.02, tempo: 118 },
        { title: 'In Your Eyes', durationMs: 237000, danceability: 0.67, energy: 0.72, valence: 0.71, acousticness: 0.002, tempo: 100 },
      ],
    },
    {
      name: 'Arctic Monkeys',
      genres: ['Indie Rock', 'Garage Rock', 'Alternative Rock'],
      imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&h=400&fit=crop',
      popularity: 89,
      followers: 18000000,
      album: {
        title: 'AM',
        releaseDate: '2013-09-09',
        coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'Do I Wanna Know?', durationMs: 272000, danceability: 0.55, energy: 0.56, valence: 0.41, acousticness: 0.17, tempo: 85 },
        { title: 'R U Mine?', durationMs: 201000, danceability: 0.44, energy: 0.85, valence: 0.45, acousticness: 0.001, tempo: 97 },
      ],
    },
    {
      name: 'Billie Eilish',
      genres: ['Electropop', 'Art Pop', 'Indie Pop'],
      imageUrl: 'https://images.unsplash.com/photo-1520523839898-50712140e947?w=400&h=400&fit=crop',
      popularity: 91,
      followers: 48000000,
      album: {
        title: 'Happier Than Ever',
        releaseDate: '2021-07-30',
        coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'bad guy', durationMs: 194000, danceability: 0.70, energy: 0.43, valence: 0.56, acousticness: 0.33, tempo: 135 },
        { title: 'Happier Than Ever', durationMs: 298000, danceability: 0.33, energy: 0.67, valence: 0.28, acousticness: 0.56, tempo: 81 },
      ],
    },
    {
      name: 'Radiohead',
      genres: ['Art Rock', 'Alternative Rock', 'Electronic', 'Experimental'],
      imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=400&fit=crop',
      popularity: 84,
      followers: 11000000,
      album: {
        title: 'Kid A',
        releaseDate: '2000-10-02',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
      },
      tracks: [
        { title: 'Idioteque', durationMs: 309000, danceability: 0.63, energy: 0.78, valence: 0.26, acousticness: 0.08, tempo: 138 },
        { title: 'Everything in Its Right Place', durationMs: 251000, danceability: 0.52, energy: 0.48, valence: 0.19, acousticness: 0.62, tempo: 124 },
      ],
    },
  ];

  const createdTracks: any[] = [];

  for (const aData of artistsData) {
    const artist = await prisma.artist.create({
      data: {
        name: aData.name,
        genres: aData.genres,
        imageUrl: aData.imageUrl,
        popularity: aData.popularity,
        followers: aData.followers,
      },
    });

    const album = await prisma.album.create({
      data: {
        title: aData.album.title,
        artistId: artist.id,
        releaseDate: aData.album.releaseDate,
        coverUrl: aData.album.coverUrl,
        genres: aData.genres,
      },
    });

    for (const tData of aData.tracks) {
      const track = await prisma.track.create({
        data: {
          title: tData.title,
          artistId: artist.id,
          albumId: album.id,
          durationMs: tData.durationMs,
          coverUrl: aData.album.coverUrl,
          popularity: Math.floor(Math.random() * 20) + 75,
          danceability: tData.danceability,
          energy: tData.energy,
          valence: tData.valence,
          acousticness: tData.acousticness,
          tempo: tData.tempo,
        },
        include: { artist: true, album: true },
      });
      createdTracks.push(track);
    }
  }

  console.log(`🎶 Created ${artistsData.length} artists, albums, and ${createdTracks.length} tracks.`);

  // 6. Generate Realistic Listening Events for Alex (spanning 30 days)
  console.log('⏳ Generating realistic listening telemetry for Alex...');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const alexEvents: any[] = [];

  // Listening pattern: heavy evening / night listening
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const dayBase = now - dayOffset * dayMs;
    // 3 to 7 listens per day
    const listensToday = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < listensToday; i++) {
      // Pick hour: weighted towards 19:00 - 02:00
      let hour: number;
      const r = Math.random();
      if (r < 0.6) {
        hour = 20 + Math.floor(Math.random() * 5); // 20:00 to 01:00
        if (hour >= 24) hour -= 24;
      } else if (r < 0.85) {
        hour = 14 + Math.floor(Math.random() * 5); // afternoon
      } else {
        hour = 9 + Math.floor(Math.random() * 4); // morning
      }

      const minute = Math.floor(Math.random() * 60);
      const playedAt = new Date(dayBase);
      playedAt.setHours(hour, minute, 0, 0);

      // Weighted selection of tracks (Daft Punk, Tame Impala, Fred again.. most frequent)
      let trackIndex: number;
      const tr = Math.random();
      if (tr < 0.35) {
        trackIndex = Math.floor(Math.random() * 4); // Daft Punk tracks
      } else if (tr < 0.65) {
        trackIndex = 4 + Math.floor(Math.random() * 3); // Tame Impala tracks
      } else if (tr < 0.85) {
        trackIndex = 7 + Math.floor(Math.random() * 3); // Fred again.. tracks
      } else {
        trackIndex = Math.floor(Math.random() * createdTracks.length);
      }

      const track = createdTracks[trackIndex];
      alexEvents.push({
        userId: alex.id,
        trackId: track.id,
        playedAt,
        durationMs: track.durationMs,
        completionRate: 0.95,
        source: 'demo',
        deviceType: Math.random() > 0.4 ? 'desktop' : 'mobile',
      });
    }
  }

  await prisma.listeningEvent.createMany({ data: alexEvents });
  console.log(`📊 Ingested ${alexEvents.length} listening events for Alex.`);

  // 7. Generate Listening Events for Friends
  const friendEvents: any[] = [];
  const friends = [sarah, marcus, elena];

  for (const friend of friends) {
    for (let dayOffset = 10; dayOffset >= 0; dayOffset--) {
      const dayBase = now - dayOffset * dayMs;
      const count = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < count; i++) {
        const hour = 12 + Math.floor(Math.random() * 10);
        const playedAt = new Date(dayBase);
        playedAt.setHours(hour, Math.floor(Math.random() * 60));

        const track = createdTracks[Math.floor(Math.random() * createdTracks.length)];
        friendEvents.push({
          userId: friend.id,
          trackId: track.id,
          playedAt,
          durationMs: track.durationMs,
          completionRate: 1.0,
          source: 'demo',
          deviceType: 'mobile',
        });
      }
    }
  }

  await prisma.listeningEvent.createMany({ data: friendEvents });
  console.log(`👥 Ingested ${friendEvents.length} listening events for friends.`);

  // 8. Add Song Reactions
  const reactions = [
    { userId: alex.id, trackId: createdTracks[0].id, reactionType: 'FIRE' },
    { userId: sarah.id, trackId: createdTracks[0].id, reactionType: 'VIBE' },
    { userId: marcus.id, trackId: createdTracks[0].id, reactionType: 'REPEAT' },
    { userId: elena.id, trackId: createdTracks[1].id, reactionType: 'LOVE' },
    { userId: alex.id, trackId: createdTracks[1].id, reactionType: 'MIND_BLOWN' },
    { userId: sarah.id, trackId: createdTracks[7].id, reactionType: 'FIRE' },
    { userId: alex.id, trackId: createdTracks[7].id, reactionType: 'REPEAT' },
    { userId: marcus.id, trackId: createdTracks[13].id, reactionType: 'LOVE' },
  ];

  for (const r of reactions) {
    await prisma.songReaction.upsert({
      where: {
        userId_trackId_reactionType: {
          userId: r.userId,
          trackId: r.trackId,
          reactionType: r.reactionType,
        },
      },
      create: r,
      update: {},
    });
  }

  console.log(`🔥 Created ${reactions.length} song reactions.`);

  // 9. Pre-generate 2026 Yearly Wrapped & Week 45 Recap for Alex
  console.log('🎁 Generating Wrapped & Weekly recaps for Alex...');
  await recapsService.generateRecap(alex.id, RecapType.YEARLY, 2026);
  await recapsService.generateRecap(alex.id, RecapType.WEEKLY, 2026, 45);

  console.log('✅ TuneScope Database Seeding Completed Successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

