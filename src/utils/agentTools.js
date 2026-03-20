const fs = require('fs/promises')
const path = require('path')
const util = require('node:util')
const childProcess = require('node:child_process')

const execFile = util.promisify(childProcess.exec)

const agentTools = {
  async readFile({ path: filePath }) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      return { success: true, content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  async writeFile({ path: filePath, content }) {
    try {
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(filePath, content, 'utf8')
      return { success: true, content: `File written: ${filePath}` }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  async exec({ command }) {
    try {
      const { stdout, stderr } = await execFile(command)
      return { success: true, stdout, stderr }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
}

module.exports = agentTools
