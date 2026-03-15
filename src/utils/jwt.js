const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'
const JWT_TTL = parseInt(process.env.JWT_TTL || '60', 10) // minutes
const REFRESH_TTL = parseInt(process.env.REFRESH_TTL || '7', 10) // days

const signAccess = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${JWT_TTL}m`,
  })
}

const signRefresh = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${REFRESH_TTL}d`,
  })
}

const verifyRefresh = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = {
  signAccess,
  signRefresh,
  verifyRefresh,
}
