require('dotenv/config')
const express = require('express')
const cors = require('cors')
const responseMiddleware = require('./src/middlewares/response.middleware')
const loadRoutes = require('./src/routes/index')

const app = express()
const port = process.env.PORT || 8000

app.use(cors())
app.use(express.json())
app.use(responseMiddleware)
loadRoutes(app)

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
