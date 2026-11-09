import { type Request, type Response } from 'express'

import logger from '../lib/logger'
import * as challengeUtils from '../lib/challengeUtils'
import { nftABI } from '../data/static/contractABIs'
import { challenges } from '../data/datacache'
import * as utils from '../lib/utils'
import * as security from '../lib/insecurity'
import { verifyMessage } from 'ethers'

const nftAddress = '0x41427790c94E7a592B17ad694eD9c06A02bb9C39'
const addressesMinted = new Set()
let isEventListenerCreated = false

export function nftMintListener () {
  return async (req: Request, res: Response) => {
    try {
      if (!isEventListenerCreated) {
        const { WebSocketProvider, Contract } = await import('ethers')
        const provider = new WebSocketProvider(`wss://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY ?? ''}`)
        provider.websocket.onerror = (error: any) => {
          logger.error(`WebSocket error (NFT Mint Listener): ${error.message || error}`)
          isEventListenerCreated = false
        }
        const contract = new Contract(nftAddress, nftABI, provider as any)
        void contract.on('NFTMinted', (minter: string) => {
          if (!addressesMinted.has(minter.toLowerCase())) {
            addressesMinted.add(minter.toLowerCase())
          }
        })
        isEventListenerCreated = true
      }
      res.status(200).json({ success: true, message: 'Event Listener Created' })
    } catch (error) {
      res.status(500).json(utils.getErrorMessage(error))
    }
  }
}

export function walletNFTVerify () {
  return (req: Request, res: Response) => {
    try {
      const user = security.verifiedUser(req)
      if (!user?.data?.id) {
        res.sendStatus(401)
        return
      }
      const metamaskAddress = req.body.walletAddress
      const signature = req.body.signature
      if (typeof metamaskAddress !== 'string' || typeof signature !== 'string') {
        res.status(400).json({ success: false, message: 'Wallet proof required' })
        return
      }
      let signer: string
      try {
        signer = verifyMessage(`Juice Shop NFT mint for ${user.data.id}`, signature)
      } catch {
        res.sendStatus(403)
        return
      }
      if (signer.toLowerCase() !== metamaskAddress.toLowerCase()) {
        res.sendStatus(403)
        return
      }
      const normalizedAddress = metamaskAddress.toLowerCase()
      if (addressesMinted.has(normalizedAddress)) {
        addressesMinted.delete(normalizedAddress)
        challengeUtils.solveIf(challenges.nftMintChallenge, () => true)
        res.status(200).json({ success: true, message: 'Challenge successfully solved', status: challenges.nftMintChallenge })
      } else {
        res.status(200).json({ success: false, message: 'Wallet did not mint the NFT', status: challenges.nftMintChallenge })
      }
    } catch (error) {
      res.status(500).json(utils.getErrorMessage(error))
    }
  }
}
