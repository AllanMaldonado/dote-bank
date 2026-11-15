process.env.NODE_ENV = 'test';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { dataIso } = require('../src/validators/comum');
const request = require('supertest');
const app = require('../src/app');

test('datas rejeitam dias inexistentes e aceitam anos bissextos', () => {
  for (const data of ['2026-02-29', '2026-02-31', '2026-04-31', '2026-13-01', 'invalida']) {
    assert.equal(dataIso.safeParse(data).success, false, data);
  }
  assert.equal(dataIso.parse('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
});

test('corpos acima do limite retornam 413', async () => {
  const r = await request(app)
    .post('/api/auth/login')
    .send({ email: 'x'.repeat(110000) })
    .expect(413);
  assert.equal(r.body.codigo, 'corpo_muito_grande');
});
