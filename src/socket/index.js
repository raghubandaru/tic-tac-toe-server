const socketio = require('socket.io')
const { verify } = require('jsonwebtoken')

const { calculateWinner, isValidToken } = require('../helpers')
const { Game } = require('../models')

function socketInit(server) {
  const io = socketio(server)

  io.use((socket, next) => {
    const accessToken = socket.handshake.query.token

    if (isValidToken(accessToken)) {
      return next()
    }

    return next(new Error('Authentication Error'))
  })

  io.on('connection', socket => {
    // Incoming connection
    console.log('New connection', socket.id)

    // emit
    io.emit('event', { text: 'hello' })

    socket.on('join', async ({ gameId }) => {
      const game = await Game.findById(gameId)
      const accessToken = socket.handshake.query.token
      const { userId } = verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

      socket.join(gameId)

      if (game) {
        const connectionGameUpdate = updatePlayerConnection(
          userId,
          socket.id,
          game
        )
        const updatedGame = await connectionGameUpdate.save()

        io.to(gameId).emit('game_update', { game: updatedGame })
      } else {
        io.to(gameId).emit('game_update', { game })
      }
    })

    socket.on('click', async ({ gameId, index }) => {
      try {
        const game = await Game.findById(gameId)
        // user can click (interact) with the active game
        if (game.status === 'active') {
          let value

          // even steps --> 'X' odd steps --> 'O
          game.step % 2 === 0 ? (value = 'X') : (value = 'O')
          // update the board with the value computed above
          game.board = [
            ...game.board.slice(0, index),
            value,
            ...game.board.slice(index + 1)
          ]
          // increment the step
          game.step = game.step + 1

          // Calculate whether the current board has winner
          const winningIndexes = calculateWinner(game.board)

          let updatedGame

          // Case if winner exist
          if (winningIndexes) {
            game.winner = game.step % 2 === 1 ? game.player1 : game.player2
            game.winningIndexes = game.winningIndexes.slice(0)
            game.winningIndexes = winningIndexes
            game.status = 'over'
          } else if (game.step === 9) {
            // case if step is out of bound
            game.draw = true
            game.status = 'over'
          }

          updatedGame = await game.save()

          io.to(gameId).emit('click_update', {
            updatedGame
          })
        }
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('disconnect', async () => {
      const accessToken = socket.handshake.query.token
      const { userId } = verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

      // Check the game that the user is associated with is still active or waiting mode
      const game = await Game.findOne({
        $or: [{ player1: userId }, { player2: userId }],
        $or: [{ status: 'active' }, { status: 'waiting' }]
      })

      if (game) {
        const disconnectionGameUpdate = disconnectPlayerConnection(
          userId,
          socket.id,
          game
        )

        if (isGameOver(game)) {
          disconnectionGameUpdate.draw = true
          disconnectionGameUpdate.status = 'over'
        }

        const updatedGame = await disconnectionGameUpdate.save()

        io.to(game.id).emit('disconnect_update', {
          updatedGame
        })

        console.log(`${socket.id} is disconnected`)
      }
    })
  })
}

function updatePlayerConnection(userId, socketId, game) {
  if (userId == game.player1) {
    game.player1Connections = [...game.player1Connections, socketId]
  } else if (userId == game.player2) {
    game.player2Connections = [...game.player2Connections, socketId]
  }

  return game
}

function disconnectPlayerConnection(userId, socketId, game) {
  if (userId == game.player1) {
    game.player1Connections = game.player1Connections.filter(
      id => id !== socketId
    )
  } else if (userId == game.player2) {
    game.player2Connections = game.player2Connections.filter(
      id => id !== socketId
    )
  }

  return game
}

function isGameOver(game) {
  return (
    game.status === 'active' &&
    game.player1Connections.length === 0 &&
    game.player2Connections.length === 0 &&
    game.winningIndexes.length === 0 &&
    !game.draw
  )
}

module.exports = socketInit
