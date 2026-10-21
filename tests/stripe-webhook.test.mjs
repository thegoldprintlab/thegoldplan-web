// Semakan kecil untuk guard webhook Stripe (jalankan: node --test tests/)
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { verifyStripeSignature, UUID_RE } from '../api/stripe-webhook.js'

const SECRET = 'whsec_test'

function sign(body, ts = Math.floor(Date.now() / 1000), secret = SECRET) {
  const v1 = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')
  return `t=${ts},v1=${v1}`
}

test('tandatangan segar diterima', () => {
  const body = '{"id":"evt_1"}'
  assert.equal(verifyStripeSignature(body, sign(body), SECRET), true)
})

test('tandatangan lebih 5 minit ditolak (replay)', () => {
  const body = '{"id":"evt_1"}'
  const old = Math.floor(Date.now() / 1000) - 600
  assert.equal(verifyStripeSignature(body, sign(body, old), SECRET), false)
})

test('body diubah ditolak', () => {
  const body = '{"id":"evt_1"}'
  assert.equal(verifyStripeSignature('{"id":"evt_2"}', sign(body), SECRET), false)
})

test('secret salah ditolak', () => {
  const body = '{"id":"evt_1"}'
  assert.equal(verifyStripeSignature(body, sign(body, undefined, 'whsec_lain'), SECRET), false)
})

test('client_reference_id mesti UUID penuh', () => {
  assert.equal(UUID_RE.test('3f2b8c1e-9a4d-4c7b-8e21-5d6a7b8c9d0e'), true)
  assert.equal(UUID_RE.test('abc-def'), false)
  assert.equal(UUID_RE.test('3f2b8c1e-9a4d-4c7b-8e21-5d6a7b8c9d0e-extra'), false)
  assert.equal(UUID_RE.test(''), false)
})
