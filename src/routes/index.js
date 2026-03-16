const fs = require('fs')
const path = require('path')

const postfix = '.route.js'

const loadRoutes = (app) => {
  const routesDir = __dirname
  const files = fs.readdirSync(routesDir)

  for (const file of files) {
    if (file.endsWith(postfix) && file !== 'index.js') {
      const modulePath = path.join(routesDir, file)
      const routeModule = require(modulePath)
      const resource = file.replace(postfix, "")
      const { router } = routeModule
      if (router) {
        app.use(`/api/${resource}`, router)
      }
    }
  }
}

module.exports = loadRoutes
