export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          rating: number;
          games: number;
          wins: number;
          losses: number;
          draws: number;
          puzzles_solved: number;
          puzzle_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string;
          rating?: number;
          games?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          puzzles_solved?: number;
          puzzle_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          rating?: number;
          games?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          puzzles_solved?: number;
          puzzle_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          player_white: string;
          player_black: string;
          result: 'white' | 'black' | 'draw' | 'ongoing';
          pgn: string;
          time_control: number;
          played_at: string;
        };
        Insert: {
          id?: string;
          player_white: string;
          player_black: string;
          result?: 'white' | 'black' | 'draw' | 'ongoing';
          pgn?: string;
          time_control: number;
          played_at?: string;
        };
        Update: {
          id?: string;
          player_white?: string;
          player_black?: string;
          result?: 'white' | 'black' | 'draw' | 'ongoing';
          pgn?: string;
          time_control?: number;
          played_at?: string;
        };
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type FriendRequest = Database['public']['Tables']['friend_requests']['Row'];
