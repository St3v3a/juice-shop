/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as utils from '../lib/utils'
import * as challengeUtils from '../lib/challengeUtils'
import { type Request, type Response } from 'express'
import * as db from '../data/mongodb'
import { challenges } from '../data/datacache'
import * as security from '../lib/insecurity'

export function trackOrder () {
  return (req: Request, res: Response) => {
    // Truncate id to avoid unintentional RCE
    const id = utils.trunc(req.params.id, 60)
    db.ordersCollection.find({ $where: `this.orderId === '${id}'` }).then((order: any) => {
      const result = utils.queryResultToJson(order)
      challengeUtils.solveIf(challenges.noSqlOrdersChallenge, () => { return result.data.length > 1 })
      if (result.data[0] === undefined) {
        result.data[0] = { orderId: id }
      }
      for (const item of result.data) {
        item.orderId = security.sanitizeSecure(String(item.orderId ?? ''))
      }
      res.json(result)
    }, () => {
      res.status(400).json({ error: 'Wrong Param' })
    })
  }
}
