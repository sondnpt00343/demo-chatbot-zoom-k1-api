const conversationService = require('../services/conversation.service')

const list = async (req, res) => {
  try {
    const convos = await conversationService.listByUserId(req.user.id)
    res.success(convos)
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

const create = async (req, res) => {
  try {
    const { type, userId } = req.body
    if (type === 'dm') {
      if (!userId) return res.error('userId là bắt buộc cho DM', 400)
      if (userId === req.user.id) return res.error('Không thể tạo DM với chính mình', 400)
      const conv = await conversationService.createDm(req.user.id, userId)
      res.success(conv)
    } else {
      res.error('Chỉ hỗ trợ type dm', 400)
    }
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

const getDmByUserId = async (req, res) => {
  try {
    const { userId } = req.params
    const conv = await conversationService.findDmByUserId(req.user.id, userId)
    if (!conv) return res.error('Không tìm thấy cuộc hội thoại', 404)
    res.success(conv)
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

const getById = async (req, res) => {
  try {
    const { id } = req.params
    const conv = await conversationService.getById(id, req.user.id)
    if (!conv) return res.error('Không tìm thấy cuộc hội thoại', 404)
    res.success(conv)
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

const getMessages = async (req, res) => {
  try {
    const { id } = req.params
    const cursor = req.query.cursor
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50)
    const result = await conversationService.getMessages(id, req.user.id, cursor, limit)
    if (!result) return res.error('Không tìm thấy cuộc hội thoại', 404)
    res.success(result)
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

const sendMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    if (!content || !content.trim()) return res.error('Nội dung là bắt buộc', 400)
    const msg = await conversationService.sendMessage(id, req.user.id, content.trim())
    if (!msg) return res.error('Không tìm thấy cuộc hội thoại', 404)
    res.success(msg)
  } catch (err) {
    res.error(err.message || 'Lỗi', 500)
  }
}

module.exports = {
  list,
  create,
  getDmByUserId,
  getById,
  getMessages,
  sendMessage,
}
