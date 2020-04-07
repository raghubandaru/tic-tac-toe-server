const cookieParser = require('cookie-parser')
const express = require('express')
const { verify } = require('jsonwebtoken')
const multipart = require('connect-multiparty')

const { auth } = require('../middlewares')
const { cloudinary } = require('../utils')
const { User } = require('../models')

const router = express.Router()

router.post('/users', async (req, res) => {
  const { email } = req.body

  const isEmailExists = await User.findOne({ email })

  if (isEmailExists) {
    return res
      .status(400)
      .send({ error: 'Account already exists with email provided' })
  }

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

    if (user) {
      const accessToken = user.generateAccessToken()

      res.cookie('tid', user.generateRefreshToken(), {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        path: '/users/refresh_token'
      })

      res.status(201).send({ user, accessToken })
    } else {
      res.status(400).send({ error })
    }
  } catch (error) {
    if (error.message === 'Email or Password did not match') {
      return res.status(401).send({ error: error.message })
    } else {
      res.status(400).send({ error })
    }
  }
})

router.patch('/users/:id', auth, multipart(), async (req, res) => {
  if (req.files) {
    cloudinary.uploader.upload(
      req.files.file.path,
      {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        public_id: req.user.id
      },
      function (error, result) {
        if (error) {
          throw new Error('Unable to upload')
        }
        User.findByIdAndUpdate(
          req.user.id,
          { avatar: `${result.version}/${result.public_id}` },
          { new: true }
        ).then(user => {
          res.status(201).send({ user })
        })
      }
    )
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

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    res.status(200).send({ user })
  } catch (error) {
    res.status(400).send({ error })
  }
})

router.post('/users/logout', auth, async (req, res) => {
  res.clearCookie('tid', { path: '/users/refresh_token' })

  res.status(201).send({ ok: true })
})

module.exports = router
