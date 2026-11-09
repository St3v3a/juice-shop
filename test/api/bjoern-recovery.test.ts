/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import type { Express } from 'express'
import { createTestApp } from './helpers/setup'

const configuredAnswer = 'operator-managed-recovery-answer-2026'
const originalAnswer = process.env.BJOERN_OWASP_RECOVERY_ANSWER
let app: Express

before(async () => {
  process.env.BJOERN_OWASP_RECOVERY_ANSWER = configuredAnswer
  const result = await createTestApp()
  app = result.app
}, { timeout: 60000 })

after(() => {
  if (originalAnswer === undefined) {
    delete process.env.BJOERN_OWASP_RECOVERY_ANSWER
  } else {
    process.env.BJOERN_OWASP_RECOVERY_ANSWER = originalAnswer
  }
})

void describe('operator-managed OWASP account recovery', () => {
  void it('rejects the public answer and accepts the configured answer', async () => {
    const recovery = {
      email: 'bjoern@owasp.org',
      new: 'kitten lesser pooch karate buffoon indoors',
      repeat: 'kitten lesser pooch karate buffoon indoors'
    }

    await request(app)
      .post('/rest/user/reset-password')
      .send({ ...recovery, answer: 'Zaya' })
      .expect(401)

    const res = await request(app)
      .post('/rest/user/reset-password')
      .send({ ...recovery, answer: configuredAnswer })
      .expect(200)

    assert.equal(res.body.user.email, 'bjoern@owasp.org')
  })
})
