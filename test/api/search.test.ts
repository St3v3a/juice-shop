/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import type { Express } from 'express'
import config from 'config'
import type { Product as ProductConfig } from '../../lib/config.types'
import { createTestApp } from './helpers/setup'

const christmasProduct = config.get<ProductConfig[]>('products').find(({ useForChristmasSpecialChallenge }) => useForChristmasSpecialChallenge)!
const pastebinLeakProduct = config.get<ProductConfig[]>('products').find(({ keywordsForPastebinDataLeakChallenge }) => keywordsForPastebinDataLeakChallenge)!
let app: Express

before(async () => {
  const result = await createTestApp()
  app = result.app
}, { timeout: 60000 })

const search = async (q: string) => request(app).get(`/rest/products/search?q=${encodeURIComponent(q)}`)

void describe('/rest/products/search', () => {
  void it('returns no products for an unmatched query', async () => {
    const res = await search('nomatcheswhatsoever')
    assert.equal(res.status, 200)
    assert.equal(res.body.data.length, 0)
  })

  void it('keeps ordinary name and description searches working', async () => {
    const name = await search('o-saft')
    const description = await search('apple')
    assert.equal(name.status, 200)
    assert.equal(name.body.data.length, 1)
    assert.equal(description.status, 200)
    assert.ok(description.body.data.length > 0)
  })

  void it('treats SQL punctuation as text instead of raising SQL errors', async () => {
    for (const q of ["';", "' union select id,email,password from users--", "') union select id,email,password from users--", "')) union select * from users--"]) {
      const res = await search(q)
      assert.equal(res.status, 200)
      assert.ok(Array.isArray(res.body.data))
    }
  })

  void it('does not read user credentials through a UNION expression', async () => {
    const res = await search("qwert')) UNION SELECT id, email, password, '4','5','6','7','8','9' FROM Users--")
    assert.equal(res.status, 200)
    assert.equal(res.body.data.length, 0)
    assert.ok(!JSON.stringify(res.body).includes('@juice-sh.op'))
  })

  void it('does not read the SQLite schema through a UNION expression', async () => {
    const res = await search("qwert')) UNION SELECT sql, '2','3','4','5','6','7','8','9' FROM sqlite_master--")
    assert.equal(res.status, 200)
    assert.equal(res.body.data.length, 0)
    assert.ok(!JSON.stringify(res.body).includes('CREATE TABLE'))
  })

  void it('does not let a query bypass the deleted-product condition', async () => {
    for (const product of [christmasProduct, pastebinLeakProduct]) {
      const normal = await search(product.name)
      const injected = await search(`${product.name}'))--`)
      assert.equal(normal.status, 200)
      assert.equal(normal.body.data.length, 0)
      assert.equal(injected.status, 200)
      assert.equal(injected.body.data.length, 0)
    }
  })

  void it('preserves the existing LIKE wildcard behavior', async () => {
    const all = await search('')
    const wildcard = await search('%')
    assert.equal(all.status, 200)
    assert.equal(wildcard.status, 200)
    assert.equal(wildcard.body.data.length, all.body.data.length)
  })

  void it('returns all active products for empty or missing search parameters', async () => {
    const products = await request(app).get('/api/Products')
    const empty = await search('')
    const missing = await request(app).get('/rest/products/search')
    assert.equal(products.status, 200)
    assert.equal(empty.status, 200)
    assert.equal(missing.status, 200)
    assert.equal(empty.body.data.length, products.body.data.length)
    assert.equal(missing.body.data.length, products.body.data.length)
  })
})
