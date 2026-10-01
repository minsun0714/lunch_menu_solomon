import { ApiError } from '@/server/errors';
import * as repository from '@/server/repositories/team-settings-repository';
import { parseTeamSettings, TeamSettings } from '@/types/team-settings';

export const loadTeamSettings = (): Promise<TeamSettings> => repository.getTeamSettings();

export function parseTeamSettingsBody(body: unknown): TeamSettings {
  try {
    return parseTeamSettings(body);
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
}

export const updateTeamSettings = (settings: TeamSettings): Promise<TeamSettings> => repository.saveTeamSettings(settings);
