/**
 * Chrome DevTools Protocol
 */
const { spawn } = require('child_process')
const axios = require('axios')
const { WebSocket } = require('ws')
const fs = require('fs')

const CHROME_EXECUTABLE_PATH = path.join(
  path.dirname(__dirname),
  'browsers',
  'chrome',
  'chrome'
)
const HOST = 'localhost'
const PORT = 9222
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
  const page = await connect()

  await page.navigate('https://jankaritech.com').then((res) => {
    console.log(res)
    page.status(res.id)
  })
  await page.status().then((res) => console.log(res))
  // close session
  setTimeout(async () => await page.close(), 10000)
})()

/**
 * ---------------------------------------------------
 * Command APIs
 * ---------------------------------------------------
 */
function navigate(sessionId, url) {
  return send({ sessionId, method: 'Page.navigate', params: { url } })
}

function status(sessionId, frameId) {
  return send({ sessionId, method: 'Page.frameNavigated', params: { frameId } })
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

async function connect() {
  // start browser in debug mode
  browser = spawn(CHROME_EXECUTABLE_PATH, CHROME_ARGS, {
    detached: true,
  })

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
        //
      })
  }

  return new Promise(function (resolve, reject) {
    ws = new WebSocket(wsServerUrl)

    ws.on('open', async function () {
      const sessionId = await getSessionId()

      const page = {
        navigate: (url) => navigate(sessionId, url),
        status: (frameId) => status(sessionId, frameId),
        close,
      }

      resolve(page)
    })
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
    sessionId = res.params.sessionId
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

    // console.log(command)
    ws.send(JSON.stringify(command))

    ws.on('message', function (data) {
      resolve(JSON.parse(data.toString('utf-8')))
    })

    ws.on('error', function (err) {
      reject(err.toString('utf-8'))
    })
  })
}
