const socketio = require('socket.io')

const { isValidToken } = require('../helpers')

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

    // Disconnection
    socket.on('disconnect', () => {
      console.log(`${socket.id} is disconnected`)
    })
  })
}

module.exports = socketInit
