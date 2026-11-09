/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { UserModel } from '../models/user'
import * as security from '../lib/insecurity'
import * as utils from '../lib/utils'

export const requireUserAccess = (allowOwn = false) => utils.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const accountId = security.authenticatedUsers.from(req)?.data?.id
  if (accountId == null) {
    res.sendStatus(403)
    return
  }

  const account = await UserModel.findByPk(accountId)
  const ownsProfile = allowOwn && /^\d+$/.test(req.params.id) && Number(req.params.id) === account?.id
  if (account?.role === security.roles.admin || ownsProfile) {
    next()
  } else {
    res.sendStatus(403)
  }
})
