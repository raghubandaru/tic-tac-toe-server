const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')
const express = require('express')
const { verify } = require('jsonwebtoken')
const multipart = require('connect-multiparty')

const { sendResetPasswordEmail } = require('../emails/resetPassword')
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

router.post('/users/reset_password/generate_token', async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email })

    if (!user) {
      throw new Error('Account with the email address does not exist')
    }

    const randomString = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = await bcrypt.hash(randomString, 12)
    user.resetPasswordExpiresIn = Date.now() + 3600000
    await user.save()

    const resetURL = `${process.env.ALLOWED_ORIGIN}/reset_password/${user._id}/${randomString}`
    // send password reset email
    sendResetPasswordEmail(user.email, resetURL, user.name)

    res
      .status(201)
      .send({ message: '✔️ Please check your email for the following steps' })
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

router.post('/users/reset_password/change_password', async (req, res) => {
  const { userId, password, confirmPassword } = req.body

  if (password !== confirmPassword) {
    throw new Error('Password and Confirm password do not match')
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new Error('Invalid user')
  }

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpiresIn = undefined
  await user.save()

  res.status(201).send({ message: '✔️ Password reset success' })
})

router.get('/users/reset_password/:userId/:resetToken', async (req, res) => {
  const { resetToken, userId } = req.params

  try {
    const user = await User.findById(userId)

    if (!user) {
      throw new Error('Invalid user')
    }

    if (user.resetPasswordToken && user.resetPasswordExpiresIn) {
      if (user.resetPasswordExpiresIn.getTime() < Date.now()) {
        throw new Error('❌ Token is invalid')
      }

      const isMatch = await bcrypt.compare(resetToken, user.resetPasswordToken)

      if (!isMatch) {
        throw new Error('❌ Token is invalid')
      }

      res.status(200).send({ message: '✔️ Token is valid' })
    } else {
      res.status(400).send({ error: '❌ Token is invalid' })
    }
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
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

router.post('/users/logout', auth, async (req, res) => {
  res.clearCookie('tid', { path: '/users/refresh_token' })

  res.status(201).send({ ok: true })
})

module.exports = router
