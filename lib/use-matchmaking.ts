import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';
import { useEffect, useRef, useState } from 'react';

export type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'playing';
export type MatchResult = { id: string; player_white: string; player_black: string } | null;

export function useMatchmaking() {
  const { user } = useAuth();
  const [status, setStatus] = useState<MatchmakingStatus>('idle');
  const [match, setMatch] = useState<MatchResult>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('online-presence');
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), user_id: user?.id });
        }
      });
    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [user?.id]);

  async function joinQueue(timeControl: number) {
    if (!supabase || !user) return;
    setStatus('searching');
    const { data, error } = await supabase.rpc('join_match_queue', {
      p_user_id: user.id,
      p_time_control: timeControl,
    });
    if (error) { setStatus('idle'); return; }
    if (data) {
      setMatch(data as MatchResult);
      setStatus('found');
    }
  }

  function leaveQueue() {
    setStatus('idle');
    setMatch(null);
  }

  return { status, match, onlineCount, joinQueue, leaveQueue };
}
