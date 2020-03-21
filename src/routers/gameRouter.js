const express = require('express')

const { auth } = require('../middlewares')
const { Game } = require('../models')

const router = express.Router()

router.post('/games', auth, async (req, res) => {
  const userId = req.user._id

  const game = await Game.findOne({
    $or: [{ player1: userId }, { player2: userId }],
    status: { $ne: 'over' }
  })

  if (game) {
    return res.status(400).send({ error: 'Please quit any active games' })
  }

  try {
    const game = new Game({ player1: req.user._id })
    const gameSaved = await game.save()

    res.status(201).send({ game: gameSaved })
  } catch (error) {
    res.status(400).send(error)
  }
})

router.patch('/games/:id', auth, async (req, res) => {
  const userId = req.user._id
  const id = req.params.id

  const game = await Game.findOne({
    $or: [{ player1: userId }, { player2: userId }],
    status: { $ne: 'over' }
  })

  if (game) {
    return res.status(400).send()
  }

  try {
    const game = await Game.findById(id)

    game.player2 = req.user._id
    game.status = 'active'
    game.turn = game.player1.toString()

    const updatedGame = await game.save()

    res.send({ updatedGame })
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
  const query = { $or: [{ player1: user }, { player2: user }] }
  // query params containing winner
  if (req.query.winner === 'true') {
    query.winner = user
  }

  // query params containing draw
  if (req.query.draw === 'true') {
    query.draw = true
  }

  const games = await Game.find(query).count()

  res.status(200).send({ games })
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
