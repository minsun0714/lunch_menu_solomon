import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TEAM_SETTINGS, parseTeamSettings } from '../types/team-settings';
import { installSupabaseMock } from './helpers/supabase';
import * as repository from '../server/repositories/team-settings-repository';

test('team settings validate required names and allow clearing the office', () => {
  assert.deepEqual(parseTeamSettings({ teamName: '  개발팀  ', officeAddress: '  ' }), { teamName: '개발팀', officeAddress: '' });
  for (const input of [null, {}, { teamName: ' ', officeAddress: '' }, { teamName: 'a'.repeat(41), officeAddress: '' }, { teamName: '팀', officeAddress: 123 }, { teamName: '팀', officeAddress: 'a'.repeat(201) }]) {
    assert.throws(() => parseTeamSettings(input));
  }
});

test('selected office coordinates are validated and discarded when its address changes', () => {
  const officePlace = { id: 'office-1', name: '카카오', address: '경기 테스트로 1', lat: 37.4, lng: 127.1 };
  const settings = { teamName: '개발팀', officeAddress: officePlace.address, officePlace };
  assert.deepEqual(parseTeamSettings(settings).officePlace, officePlace);
  assert.equal(parseTeamSettings({ ...settings, officeAddress: '다른 주소' }).officePlace, undefined);
  assert.throws(() => parseTeamSettings({ ...settings, officePlace: { ...officePlace, lat: 100 } }));
  assert.throws(() => parseTeamSettings({ ...settings, officePlace: { ...officePlace, lng: '127.1' } }));
});

test('team settings persist and propagate database failures', async (t) => {
  const database = installSupabaseMock(t);
  assert.deepEqual(await repository.getTeamSettings(), DEFAULT_TEAM_SETTINGS);
  const settings = { teamName: '개발팀', officeAddress: '서울특별시 중구 세종대로 110', officePlace: { id: 'office-1', name: '서울시청', address: '서울특별시 중구 세종대로 110', lat: 37.5665, lng: 126.978 } };
  await repository.saveTeamSettings(settings);
  assert.deepEqual(await repository.getTeamSettings(), settings);
  await repository.saveTeamSettings({ ...settings, officeAddress: '' });
  assert.equal((await repository.getTeamSettings()).officeAddress, '');
  database.failNext();
  await assert.rejects(repository.saveTeamSettings(settings));
  database.failNext();
  await assert.rejects(repository.getTeamSettings());
});
