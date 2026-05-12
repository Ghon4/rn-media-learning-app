import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Expected Supabase table (SQL): create table if using sync:
 * create table public.app_state (
 *   device_id text primary key,
 *   payload jsonb not null default '{}',
 *   updated_at timestamptz default now()
 * );
 * alter table public.app_state enable row level security;
 * create policy "anon_rw_own" on public.app_state for all using (true) with check (true);
 */

export const SYNC_DEVICE_STORAGE_KEY = 'sync-device-id-v1';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}

export function isSyncConfigured(): boolean {
  return Boolean(url && anonKey);
}

export async function getSyncDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(SYNC_DEVICE_STORAGE_KEY);
  if (!id) {
    id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(SYNC_DEVICE_STORAGE_KEY, id);
  }
  return id;
}

export type SyncPayload = Record<string, unknown>;

export async function pushPayload(payload: SyncPayload): Promise<{ ok: boolean; error?: string }> {
  const supabase = getClient();
  if (!supabase) return { ok: false, error: 'not_configured' };
  try {
    const device_id = await getSyncDeviceId();
    const { error } = await supabase.from('app_state').upsert(
      {
        device_id,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id' },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'sync_failed' };
  }
}

export async function pullPayload(): Promise<{ ok: boolean; payload?: SyncPayload; error?: string }> {
  const supabase = getClient();
  if (!supabase) return { ok: false, error: 'not_configured' };
  try {
    const device_id = await getSyncDeviceId();
    const { data, error } = await supabase
      .from('app_state')
      .select('payload')
      .eq('device_id', device_id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    const payload = data?.payload as SyncPayload | undefined;
    return { ok: true, payload: payload ?? {} };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'sync_failed' };
  }
}
