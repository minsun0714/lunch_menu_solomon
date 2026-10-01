import { NextRequest, NextResponse } from 'next/server';
import { getTeamSettings, saveTeamSettings } from '@/lib/team-settings';
import { parseTeamSettings } from '@/types/team-settings';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await getTeamSettings() });
  } catch (error) {
    console.error('Failed to load team settings:', error);
    return NextResponse.json({ success: false, error: '팀 설정을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let settings;
  try {
    settings = parseTeamSettings(await request.json());
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof SyntaxError ? '설정 내용을 확인해주세요.' : (error as Error).message }, { status: 400 });
  }
  try {
    return NextResponse.json({ success: true, data: await saveTeamSettings(settings) });
  } catch (error) {
    console.error('Failed to save team settings:', error);
    return NextResponse.json({ success: false, error: '설정을 저장하지 못했습니다. 다시 시도해주세요.' }, { status: 500 });
  }
}
