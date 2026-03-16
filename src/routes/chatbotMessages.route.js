const express = require('express')
const chatbotMessageController = require('../controllers/chatbotMessage.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router()

router.use(authMiddleware)

router.post('/chat', chatbotMessageController.chat);
router.get('/messages', chatbotMessageController.getMessages);

module.exports = { router }
