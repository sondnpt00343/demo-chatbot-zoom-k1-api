const express = require('express')
const conversationsController = require('../controllers/conversations.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router()

router.use(authMiddleware)

router.get('/', conversationsController.list)
router.post('/', conversationsController.create)
router.get('/dm/:userId', conversationsController.getDmByUserId)
router.get('/:id', conversationsController.getById)
router.get('/:id/messages', conversationsController.getMessages)
router.post('/:id/messages', conversationsController.sendMessage)

module.exports = { router }
