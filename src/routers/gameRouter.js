const express = require('express')
const shortid = require('shortid')

const { auth } = require('../middlewares')
const { Game } = require('../models')

const router = express.Router()

router.post('/games', auth, async (req, res) => {
  const userId = req.user.id

  const game = await Game.findOne({
    $or: [{ player1: userId }, { player2: userId }],
    status: { $ne: 'over' }
  })

  if (game) {
    return res.status(400).send({ error: 'Please quit any active games' })
  }

  try {
    const code = shortid.generate()
    const game = new Game({ code, player1: req.user._id })
    const gameSaved = await game.save()

    res.status(201).send({ game: gameSaved })
  } catch (error) {
    res.status(400).send(error)
  }
})

router.patch('/games/:code', auth, async (req, res) => {
  const userId = req.user._id
  const code = req.params.code

  const game = await Game.findOne({
    $or: [{ player1: userId }, { player2: userId }],
    status: { $ne: 'over' }
  })

  if (game) {
    return res.status(400).send()
  }

  try {
    const game = await Game.findOne({ code })

    if (!game) {
      return res.status(400).send({ error: 'Invalid code' })
    } else {
      if (game.status !== 'waiting') {
        return res.status(400).send({ error: 'Game is not active anymore' })
      }

      game.player2 = req.user.id
      game.status = 'active'
      game.turn = game.player1.toString()

      const updatedGame = await game.save()

      res.send({ updatedGame })
    }
  } catch (error) {
    res.status(400).send(error)
  }
})

router.get('/games/active', auth, async (req, res) => {
  const userId = req.user.id

  try {
    const game = await Game.findOne({
      $or: [{ player1: userId }, { player2: userId }],
      status: { $ne: 'over' }
    })

    res.status(200).send({ game })
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/games/stats', auth, async (req, res) => {
  const user = req.query.user

  if (user) {
    const totalQuery = { $or: [{ player1: user }, { player2: user }] }
    const winnerQuery = { ...totalQuery, winner: user }
    const drawQuery = { ...totalQuery, draw: true }

    const [total, win, draw] = await Promise.all([
      Game.find(totalQuery).countDocuments(),
      Game.find(winnerQuery).countDocuments(),
      Game.find(drawQuery).countDocuments()
    ]).catch(error => res.status(400).send({ error }))

    const stats = { total, win, draw }

    res.status(200).send({ stats })
  } else {
    res.status(400).send({ error: 'User required' })
  }
})

router.get('/games/:id', auth, async (req, res) => {
  const gameId = req.params.id

  const game = await Game.findById(gameId)

  if (game) {
    return res.status(200).send({ game })
  }

  res.status(400).send()
})

module.exports = router
