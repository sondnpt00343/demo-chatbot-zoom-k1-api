const fs = require('fs')
const path = require('path')

const loadRoutes = (app) => {
  const routesDir = __dirname
  const files = fs.readdirSync(routesDir)

  files.forEach((file) => {
    if (file.endsWith('.routes.js') && file !== 'index.js') {
      const routeModule = require(path.join(routesDir, file))
      const { router, prefix } = routeModule
      if (router && prefix) {
        app.use(`/api${prefix}`, router)
      }
    }
  })
}

module.exports = loadRoutes
