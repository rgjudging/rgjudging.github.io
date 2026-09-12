import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isProductionConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isProductionConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadCompetition(competitionId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('competitions')
    .select('*, routines(*, participants(*)), competition_judges(*, profiles(*))')
    .eq('id', competitionId)
    .single();
  if (error) throw error;
  return data;
}
