/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { reviewsCollection } from '../data/mongodb'
import * as security from '../lib/insecurity'

export function requireReviewOwner () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const email = security.verifiedUser(req)?.data?.email
    if (!email) {
      res.sendStatus(403)
      return
    }
    if (typeof req.body.id !== 'string') {
      res.status(400).json({ error: 'Wrong Params' })
      return
    }
    const reviews = await reviewsCollection.find({ _id: req.body.id, author: email })
    if (reviews.length !== 1) {
      res.sendStatus(403)
      return
    }
    next()
  }
}
