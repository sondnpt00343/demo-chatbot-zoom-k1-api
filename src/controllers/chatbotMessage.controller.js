const chatbotMessageService = require('../services/chatbotMessage.service')

const chat = async (req, res) => {
  const result = await chatbotMessageService.chat(req.user, req.body.input);
  res.success(result)
}

const getMessages = async (req, res) => {
  const limit = Math.min(req.query.limit || 20, 50);
  const messages = await chatbotMessageService.getMessages(req.user, limit);
  res.success(messages);
}

module.exports = {
  chat,
  getMessages
}
