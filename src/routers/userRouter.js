const cookieParser = require('cookie-parser')
const express = require('express')
const { verify } = require('jsonwebtoken')

const { auth } = require('../middlewares')
const { User } = require('../models')

const router = express.Router()

router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body)
    const savedUser = await user.save()
    const accessToken = savedUser.generateAccessToken()

    res.cookie('tid', savedUser.generateRefreshToken(), {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      path: '/users/refresh_token'
    })

    res.status(201).send({ user: savedUser, accessToken })
  } catch (error) {
    res.status(400).send({ error })
  }
})

router.post('/users/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findByCredentials(email, password)
    const accessToken = user.generateAccessToken()

    res.cookie('tid', user.generateRefreshToken(), {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      path: '/users/refresh_token'
    })

    res.status(201).send({ user, accessToken })
  } catch (error) {
    res.status(400).send({ error })
  }
})

router.post('/users/refresh_token', cookieParser(), async (req, res) => {
  const refreshToken = req.cookies.tid

  if (!refreshToken) {
    return res.status(400).send({ ok: false, accessToken: '' })
  }

  let payload

  try {
    payload = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
  } catch (error) {
    return res.status(400).send({ ok: false, accessToken: '' })
  }

  const user = await User.findById(payload.userId)

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return res.status(400).send({ ok: false, accessToken: '' })
  }

  res.cookie('tid', user.generateRefreshToken(), {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    path: '/users/refresh_token'
  })

  const accessToken = user.generateAccessToken()

  return res.status(201).send({ ok: true, accessToken })
})

router.get('/users/me', auth, async (req, res) => {
  res.status(200).send({ user: req.user })
})

router.post('/users/logout', auth, async (req, res) => {
  res.clearCookie('tid', { path: '/users/refresh_token' })

  res.status(201).send({ ok: true })
})

module.exports = router
