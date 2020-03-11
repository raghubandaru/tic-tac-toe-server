require('./db/mongoose')
const cors = require('cors')
const express = require('express')

const app = express()

app.use(cors())

module.exports = app
