const jwt = require('jsonwebtoken')
const { verify } = jwt
const { prisma } = require('../libs/prisma')
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.error('Token không hợp lệ', 401)
    }
    const token = authHeader.slice(7)
    const payload = verify(token, JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true },
    })
    if (!user) {
      return res.error('User không tồn tại', 401)
    }
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.error('Token không hợp lệ hoặc đã hết hạn', 401)
    }
    res.error(err.message || 'Xác thực thất bại', 500)
  }
}

module.exports = authMiddleware
