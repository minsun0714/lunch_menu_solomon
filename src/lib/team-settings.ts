import { DEFAULT_TEAM_SETTINGS, parseTeamSettings, TeamSettings } from '../types/team-settings';
import { getSupabase } from './supabase';

export async function getTeamSettings(): Promise<TeamSettings> {
  const { data, error } = await getSupabase().from('team_settings').select('*').eq('id', true).maybeSingle();
  if (error) throw error;
  if (!data) return { ...DEFAULT_TEAM_SETTINGS };
  return parseTeamSettings({ teamName: data.team_name, officeAddress: data.office_address, officePlace: data.office_place });
}

export async function saveTeamSettings(settings: TeamSettings): Promise<TeamSettings> {
  const validated = parseTeamSettings(settings);
  const { error } = await getSupabase().from('team_settings').upsert({
    id: true, team_name: validated.teamName, office_address: validated.officeAddress, office_place: validated.officePlace || null,
  }, { onConflict: 'id' });
  if (error) throw error;
  return validated;
}
