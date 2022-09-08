/**
 * Chrome DevTools Protocol
 */
const { spawn } = require('child_process')
const axios = require('axios')
const { WebSocket } = require('ws')
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const CHROME_EXECUTABLE_PATH = path.join(
  path.dirname(__dirname),
  'browsers',
  'chrome',
  'chrome'
)
const HOST = 'localhost'
const PORT = 4444
const USER_DIR = path.join(
  path.dirname(__dirname),
  'browsers',
  'data',
  'chrome'
)
const CHROME_ARGS = [
  `--remote-debugging-port=${PORT}`, // debug mode
  `--user-data-dir=${USER_DIR}`, // user profile
  '--no-first-run',
]
let ws = null
let browser = null

/**
 * ---------------------------------------------------
 * webUI Tests
 * ---------------------------------------------------
 */
;(async function () {
  let page = null
  let PASSED = false
  try {
    page = await createSession()

    await page.goto('https://jankaritech.com')

    const title = await page.getTitle()

    assert.strictEqual(title, 'JankariTech')
    PASSED = true
  } catch (e) {
    console.log(e)
  } finally {
    await page.close()

    if (PASSED) {
      console.info('[OK] Tests passed!')
    } else {
      console.error('[FAILED] Tests failed!')
    }
  }
})()

/**
 * ---------------------------------------------------
 * Command APIs
 * ---------------------------------------------------
 */
function goto(sessionId, url) {
  return send({ sessionId, method: 'Page.navigate', params: { url } })
}

async function getTitle(sessionId) {
  const {
    result: {
      root: { nodeId },
    },
  } = await send({ sessionId, method: 'DOM.getDocument' })
  const titleNode = await send({
    sessionId,
    method: 'DOM.querySelector',
    params: { nodeId, selector: 'title' },
  })
  const {
    result: { outerHTML },
  } = await send({
    sessionId,
    method: 'DOM.getOuterHTML',
    params: { nodeId: titleNode.result.nodeId },
  })
  const title = outerHTML.replace('<title>', '').replace('</title>', '')
  return title
}

async function close() {
  try {
    await send({ method: 'Browser.close' })
    await ws.close()
    process.kill(-browser.pid)

    fs.rmSync(USER_DIR, { recursive: true })
  } catch (e) {
    console.log(e)
  }
}

/**
 * ---------------------------------------------------
 * Setup
 * ---------------------------------------------------
 */

async function createSession() {
  startDebugServer()

  let ready = false
  let wsServerUrl = ''

  // connect to ws server
  while (!ready) {
    await axios
      .get(`http://${HOST}:${PORT}/json/version`)
      .then(({ data }) => {
        wsServerUrl = data.webSocketDebuggerUrl
        ready = true
      })
      .catch((err) => {
        // console.log(err)
      })
  }

  return new Promise(function (resolve, reject) {
    ws = new WebSocket(wsServerUrl)

    ws.on('open', async function () {
      const sessionId = await getSessionId()

      const page = {
        goto: (url) => goto(sessionId, url),
        getTitle: () => getTitle(sessionId),
        close,
      }

      resolve(page)
    })
  })
}

function startDebugServer() {
  // start browser in debug mode
  browser = spawn(CHROME_EXECUTABLE_PATH, CHROME_ARGS, {
    detached: true,
  })
}

async function getSessionId() {
  let pageTarget = null
  let sessionId = null

  await send({ method: 'Target.getTargets' }).then(function (res) {
    pageTarget = res.result.targetInfos.find(function (target) {
      return target.type === 'page'
    })
  })

  await send({
    method: 'Target.attachToTarget',
    params: {
      targetId: pageTarget.targetId,
      flatten: true,
    },
  }).then(function (res) {
    sessionId = res.result.sessionId
  })

  return sessionId
}

function send(command) {
  return new Promise(function (resolve, reject) {
    const id = Number(Date.now().toString().substring(5))
    command = {
      id,
      ...command,
    }

    ws.send(JSON.stringify(command))

    ws.on('message', function (data) {
      const message = JSON.parse(data.toString('utf-8'))
      if (message.id && id === message.id) {
        resolve(message)
      }
    })

    ws.on('error', function (err) {
      reject(err.toString('utf-8'))
    })
  })
}
