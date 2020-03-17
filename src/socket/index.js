const socketio = require('socket.io')

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
      socket.join(gameId)
      io.to(gameId).emit('game_update', { game })
    })

    socket.on('click', async ({ gameId, index }) => {
      console.log(gameId, index)
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

            updatedGame = await game.save()
            console.log(updatedGame)
          } else if (game.step === 9) {
            // case if step is out of bound
            game.draw = true
            game.status = 'over'

            updatedGame = await game.save()
            console.log(updatedGame)
          } else {
            // case game continues
            updatedGame = await game.save()
            console.log(updatedGame)
          }

          io.to(gameId).emit('click_update', {
            updatedGame
          })
        }
      } catch (error) {
        console.log(error)
      }
    })

    // Disconnection
    socket.on('disconnect', () => {
      console.log(`${socket.id} is disconnected`)
    })
  })
}

module.exports = socketInit
