const { prisma } = require('../libs/prisma')

const list = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true },
      orderBy: { username: 'asc' },
    })
    res.success(users)
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

const getByUsername = async (req, res) => {
  try {
    const { username } = req.params
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true },
    })
    if (!user) {
      return res.error('User không tồn tại', 404)
    }
    res.success(user)
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

module.exports = {
  list,
  getByUsername,
}
