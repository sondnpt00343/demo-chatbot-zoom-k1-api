const agentMessageService = require('../services/agentMessage.service')

const chat = async (req, res) => {
  const result = await agentMessageService.chat(req.user, req.body.input)
  res.success(result)
}

const getMessages = async (req, res) => {
  const limit = Math.min(req.query.limit || 20, 50)
  const messages = await agentMessageService.getMessages(req.user, limit)
  res.success(messages)
}

module.exports = {
  chat,
  getMessages
}
