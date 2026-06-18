import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type GameResult = 'win' | 'loss' | 'draw';

export type SocialPlayer = {
  id: string;
  name: string;
  rating: number;
  status: 'available' | 'requested' | 'friend';
};

export type FriendInvitation = {
  id: string;
  name: string;
  rating: number;
};

type PlayerStats = {
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  puzzlesSolved: number;
  puzzleScore: number;
  streak: number;
  lastPlayedDate: string;
  achievements: string[];
};

type PlayerProfileContextValue = {
  playerName: string;
  stats: PlayerStats;
  players: SocialPlayer[];
  invitations: FriendInvitation[];
  friends: SocialPlayer[];
  solvedPuzzleIds: string[];
  newAchievements: string[];
  clearNewAchievements: () => void;
  savePlayerName: (name: string) => void;
  recordGameResult: (result: GameResult) => void;
  recordPuzzleSolved: (puzzleId: string) => void;
  resetStats: () => void;
  sendFriendRequest: (playerId: string) => void;
  acceptInvitation: (invitationId: string) => void;
  rejectInvitation: (invitationId: string) => void;
};

type StoredProfile = {
  playerName: string;
  stats: PlayerStats;
  players: SocialPlayer[];
  invitations: FriendInvitation[];
  friends: SocialPlayer[];
  solvedPuzzleIds: string[];
};

const PROFILE_STORAGE_KEY = 'knightmind.profile';

const starterStats: PlayerStats = {
  rating: 800,
  games: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  puzzlesSolved: 0,
  puzzleScore: 0,
  streak: 0,
  lastPlayedDate: '',
  achievements: [],
};

const starterPlayers: SocialPlayer[] = [
  { id: 'p1', name: 'Arjun Tactics', rating: 920, status: 'available' },
  { id: 'p2', name: 'Meera Mate', rating: 1040, status: 'available' },
  { id: 'p3', name: 'Ravi Rook', rating: 780, status: 'available' },
  { id: 'p4', name: 'Sneha Queen', rating: 1120, status: 'available' },
];

const starterInvitations: FriendInvitation[] = [
  { id: 'i1', name: 'Dev Knight', rating: 860 },
  { id: 'i2', name: 'Priya Puzzle', rating: 970 },
];

const PlayerProfileContext = createContext<PlayerProfileContextValue | null>(null);

export function PlayerProfileProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState('KnightMind Player');
  const [stats, setStats] = useState<PlayerStats>(starterStats);
  const [players, setPlayers] = useState<SocialPlayer[]>(starterPlayers);
  const [invitations, setInvitations] = useState<FriendInvitation[]>(starterInvitations);
  const [friends, setFriends] = useState<SocialPlayer[]>([]);
  const [solvedPuzzleIds, setSolvedPuzzleIds] = useState<string[]>([]);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    async function loadProfile() {
      const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

      if (!savedProfile) {
        hasLoadedRef.current = true;
        return;
      }

      try {
        const parsed = JSON.parse(savedProfile) as Partial<StoredProfile>;
        if (parsed.playerName) setPlayerName(parsed.playerName);
        if (parsed.stats) setStats({ ...starterStats, ...parsed.stats });
        if (parsed.players) setPlayers(parsed.players);
        if (parsed.invitations) setInvitations(parsed.invitations);
        if (parsed.friends) setFriends(parsed.friends);
        if (parsed.solvedPuzzleIds) setSolvedPuzzleIds(parsed.solvedPuzzleIds);
      } finally {
        hasLoadedRef.current = true;
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }

    const storedProfile: StoredProfile = {
      playerName,
      stats,
      players,
      invitations,
      friends,
      solvedPuzzleIds,
    };

    AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(storedProfile));
  }, [friends, invitations, playerName, players, solvedPuzzleIds, stats]);

  const value = useMemo(
    () => ({
      playerName,
      stats,
      players,
      invitations,
      friends,
      solvedPuzzleIds,
      newAchievements,
      clearNewAchievements: () => setNewAchievements([]),
      savePlayerName: (name: string) => {
        const cleanName = name.trim();
        setPlayerName(cleanName.length > 0 ? cleanName : 'KnightMind Player');
      },
      recordGameResult: (result: GameResult) => {
        const today = new Date().toISOString().split('T')[0];
        setStats((current) => {
          const newStreak = current.lastPlayedDate === today ? current.streak
            : current.lastPlayedDate === '' ? 1
            : new Date(current.lastPlayedDate).getTime() === new Date(today).getTime() - 86400000 ? current.streak + 1
            : 1;
          const newStats = {
            ...current,
            rating: Math.max(100, current.rating + (result === 'win' ? 8 : result === 'loss' ? -8 : 0)),
            games: current.games + 1,
            wins: current.wins + (result === 'win' ? 1 : 0),
            losses: current.losses + (result === 'loss' ? 1 : 0),
            draws: current.draws + (result === 'draw' ? 1 : 0),
            streak: newStreak,
            lastPlayedDate: today,
          };
          const { checkAchievements } = require('@/lib/achievements');
          const unlocked = checkAchievements(current.achievements, newStats);
          if (unlocked.length > 0) {
            setNewAchievements(unlocked);
            newStats.achievements = [...current.achievements, ...unlocked];
          }
          return newStats;
        });
      },
      recordPuzzleSolved: (puzzleId: string) => {
        if (solvedPuzzleIds.includes(puzzleId)) return;
        setSolvedPuzzleIds((current) => [...current, puzzleId]);
        setStats((current) => {
          const newStats = {
            ...current,
            rating: current.rating + 2,
            puzzlesSolved: current.puzzlesSolved + 1,
            puzzleScore: current.puzzleScore + 10,
          };
          const { checkAchievements } = require('@/lib/achievements');
          const unlocked = checkAchievements(current.achievements, newStats);
          if (unlocked.length > 0) {
            setNewAchievements(unlocked);
            newStats.achievements = [...current.achievements, ...unlocked];
          }
          return newStats;
        });
      },
      resetStats: () => {
        setStats(starterStats);
        setSolvedPuzzleIds([]);
      },
      sendFriendRequest: (playerId: string) => {
        setPlayers((current) =>
          current.map((player) =>
            player.id === playerId ? { ...player, status: 'requested' } : player
          )
        );
      },
      acceptInvitation: (invitationId: string) => {
        const invitation = invitations.find((item) => item.id === invitationId);
        if (!invitation) return;
        setFriends((current) => [
          ...current,
          { id: invitation.id, name: invitation.name, rating: invitation.rating, status: 'friend' },
        ]);
        setInvitations((current) => current.filter((item) => item.id !== invitationId));
      },
      rejectInvitation: (invitationId: string) => {
        setInvitations((current) => current.filter((item) => item.id !== invitationId));
      },
    }),
    [friends, invitations, newAchievements, playerName, players, solvedPuzzleIds, stats]
  );

  return <PlayerProfileContext.Provider value={value}>{children}</PlayerProfileContext.Provider>;
}

export function usePlayerProfile() {
  const value = useContext(PlayerProfileContext);

  if (!value) {
    throw new Error('usePlayerProfile must be used inside PlayerProfileProvider');
  }

  return value;
}
