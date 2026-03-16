const bcrypt = require('bcrypt')
const { prisma } = require('../libs/prisma')

class AuthService {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })
  }

  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    return prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        username: data.username.trim().toLowerCase(),
        password: hashedPassword,
      },
    })
  }

  async findByUsername(username) {
    return prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    })
  }

  async validatePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed)
  }
}

module.exports = new AuthService()
