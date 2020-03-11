require('./db/mongoose')
const cors = require('cors')
const express = require('express')

const { userRouter } = require('./routers')

const app = express()

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true
  })
)
app.use(express.json())
app.use(userRouter)

module.exports = app
