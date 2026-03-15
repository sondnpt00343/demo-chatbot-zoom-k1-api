const authService = require('../services/auth.service')
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const generateTokens = (userId) => {
  const payload = { sub: userId }
  return {
    access_token: signAccess(payload),
    refresh_token: signRefresh(payload),
  }
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

const register = async (req, res) => {
  try {
    const { email, password, username } = req.body

    if (!email || !email.trim()) {
      return res.error('Email là bắt buộc', 400)
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.error('Email không hợp lệ', 400)
    }
    if (!username || !username.trim()) {
      return res.error('Username là bắt buộc', 400)
    }
    if (username.length < 3) {
      return res.error('Username tối thiểu 3 ký tự', 400)
    }
    if (!USERNAME_REGEX.test(username.trim())) {
      return res.error('Username chỉ được chứa chữ, số và gạch dưới', 400)
    }
    if (!password || password.length < 6) {
      return res.error('Mật khẩu tối thiểu 6 ký tự', 400)
    }

    const existingEmail = await authService.findByEmail(email)
    if (existingEmail) {
      return res.error('Email đã được sử dụng', 400)
    }
    const existingUsername = await authService.findByUsername(username)
    if (existingUsername) {
      return res.error('Username đã được sử dụng', 400)
    }

    const user = await authService.create({ email, password, username })
    const tokens = generateTokens(user.id)
    res.success(tokens)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.error('Email đã được sử dụng', 400)
    }
    res.error(err.message || 'Đăng ký thất bại', 500)
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.error('Email và mật khẩu là bắt buộc', 400)
    }

    const user = await authService.findByEmail(email)
    if (!user) {
      return res.error('Email hoặc mật khẩu không đúng', 401)
    }

    const valid = await authService.validatePassword(password, user.password)
    if (!valid) {
      return res.error('Email hoặc mật khẩu không đúng', 401)
    }

    const tokens = generateTokens(user.id)
    res.success(tokens)
  } catch (err) {
    res.error(err.message || 'Đăng nhập thất bại', 500)
  }
}

const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.error('refresh_token là bắt buộc', 400)
    }

    const payload = verifyRefresh(refresh_token)
    const tokens = generateTokens(payload.sub)
    res.success(tokens)
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.error('Token không hợp lệ hoặc đã hết hạn', 401)
    }
    res.error(err.message || 'Làm mới token thất bại', 500)
  }
}

const me = async (req, res) => {
  try {
    const user = req.user
    res.success({ id: user.id, email: user.email, username: user.username })
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

module.exports = {
  register,
  login,
  refresh,
  me,
}
