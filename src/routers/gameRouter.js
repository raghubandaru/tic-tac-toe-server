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

module.exports = router
