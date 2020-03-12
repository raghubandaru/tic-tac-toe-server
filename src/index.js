const http = require('http')

const app = require('./app')
const socketInit = require('./socket')

const server = http.createServer(app)
socketInit(server)

const port = process.env.PORT || 5000

server.listen(port, () => console.log('Server is up and running'))
