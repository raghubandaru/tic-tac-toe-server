const { verify } = require('jsonwebtoken')

function isValidToken(accessToken) {
  return verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
}

module.exports = isValidToken
