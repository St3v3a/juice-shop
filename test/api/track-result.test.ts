/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import type { Express } from 'express'
import { createTestApp } from './helpers/setup'
import { ordersCollection } from '../../data/mongodb'

let app: Express

before(async () => {
  const result = await createTestApp()
  app = result.app
}, { timeout: 60000 })

void describe('/rest/track-order/:id', () => {
  void it('GET tracking results for the order id', async () => {
    const orders = await ordersCollection.find()
    assert.ok(orders.length > 0)
    const res = await request(app).get('/rest/track-order/' + orders[0].orderId)
    assert.equal(res.status, 200)
    assert.equal(res.body.data.length, 1)
    assert.equal(res.body.data[0].orderId, orders[0].orderId)
    assert.equal(res.body.data[0].email, orders[0].email)
  })

  void it('GET does not reveal orders from an injected orderId', async () => {
    const res = await request(app)
      .get('/rest/track-order/%27%20%7C%7C%20true%20%7C%7C%20%27')
    assert.equal(res.status, 200)
    assert.ok(res.headers['content-type']?.includes('application/json'))
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 1)
    assert.equal(res.body.data[0].email, undefined)
  })
})
