const express = require('express')
const usersController = require('../controllers/users.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router()

router.get('/', authMiddleware, usersController.list)
router.get('/:username', usersController.getByUsername)

module.exports = {
  router,
  prefix: '/users',
}
