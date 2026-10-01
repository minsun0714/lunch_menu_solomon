import { NextRequest } from 'next/server';
import { fail, handleRoute, ok } from '@/server/http';
import { loadTeamSettings, parseTeamSettingsBody, updateTeamSettings } from '@/server/services/team-settings-service';

export async function GET() {
  return handleRoute({ error: '팀 설정을 불러오지 못했습니다.', log: 'Failed to load team settings:' }, async () => ok(await loadTeamSettings()));
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, '설정 내용을 확인해주세요.');
  }
  return handleRoute({ error: '설정을 저장하지 못했습니다. 다시 시도해주세요.', log: 'Failed to save team settings:' }, async () => (
    ok(await updateTeamSettings(parseTeamSettingsBody(body)))
  ));
}
