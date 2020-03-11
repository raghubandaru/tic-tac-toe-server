require('./db/mongoose')
const cors = require('cors')
const express = require('express')

const { userRouter, gameRouter } = require('./routers')

const app = express()

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true
  })
)
app.use(express.json())
app.use(userRouter)
app.use(gameRouter)

module.exports = app
