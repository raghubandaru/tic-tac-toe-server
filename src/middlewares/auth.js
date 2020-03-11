const { verify } = require('jsonwebtoken')

const User = require('../models/User')

const auth = async (req, res, next) => {
  try {
    const accessToken = req.header('Authorization').replace('Bearer ', '')
    const payload = verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    if (!accessToken) {
      throw new Error('Not found any access token')
    }

    let user

    try {
      user = await User.findById(payload.userId)
    } catch (error) {
      throw new Error('Unable to fetch user from payload')
    }

    if (!user) throw new Error()

    req.user = user

    next()
  } catch (error) {
    res.status(401).send({ error })
  }
}

module.exports = auth
