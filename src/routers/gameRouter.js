const express = require('express')

const { auth } = require('../middlewares')
const { Game } = require('../models')

const router = express.Router()

router.post('/games', auth, async (req, res) => {
  try {
    const game = new Game({ player1: req.user._id })
    const gameSaved = await game.save()

    res.status(201).send({ game: gameSaved })
  } catch (error) {
    res.status(400).send(error)
  }
})

router.patch('/games/:id', auth, async (req, res) => {
  const id = req.params.id

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

module.exports = router
