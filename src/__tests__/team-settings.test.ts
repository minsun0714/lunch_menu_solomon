import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_TEAM_SETTINGS, parseTeamSettings } from '../types/team-settings';

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

test('team settings persist, reject corrupt data, and propagate write failures', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'solomon-settings-'));
  const originalCwd = process.cwd();
  let storage: typeof import('../lib/team-settings');
  try {
    process.chdir(directory);
    storage = await import('../lib/team-settings');
  } finally {
    process.chdir(originalCwd);
  }
  const dataDirectory = path.join(directory, 'data');
  const settingsFile = path.join(dataDirectory, 'team-settings.json');
  try {
    assert.deepEqual(await storage.getTeamSettings(), DEFAULT_TEAM_SETTINGS);
    const settings = { teamName: '개발팀', officeAddress: '서울특별시 중구 세종대로 110', officePlace: { id: 'office-1', name: '서울시청', address: '서울특별시 중구 세종대로 110', lat: 37.5665, lng: 126.978 } };
    await storage.saveTeamSettings(settings);
    assert.deepEqual(await storage.getTeamSettings(), settings);
    await storage.saveTeamSettings({ ...settings, officeAddress: '' });
    assert.equal((await storage.getTeamSettings()).officeAddress, '');
    await fs.writeFile(settingsFile, 'invalid JSON');
    await assert.rejects(storage.getTeamSettings());
    assert.equal(await fs.readFile(settingsFile, 'utf8'), 'invalid JSON');
    await fs.unlink(settingsFile);
    await fs.rmdir(dataDirectory);
    await fs.writeFile(dataDirectory, 'block directory creation');
    await assert.rejects(storage.saveTeamSettings(settings));
    await fs.unlink(dataDirectory);
  } finally {
    await fs.rm(settingsFile, { force: true });
    try { await fs.rmdir(dataDirectory); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    await fs.rmdir(directory);
  }
});
