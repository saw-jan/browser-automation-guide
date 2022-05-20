/**
 * Chrome driver (WebDriver for Chrome)
 */
const axios = require('axios')
const assert = require('assert')
const { spawn } = require('child_process')
const path = require('path')

const PORT = 4444
const CHROME_DRIVER_PATH = path.join(
  path.dirname(__dirname),
  'drivers',
  'chromedriver'
)
const CHROME_EXECUTABLE_PATH = path.join(
  path.dirname(__dirname),
  'browsers',
  'chrome',
  'chrome'
)
const USER_DIR = path.join(
  path.dirname(__dirname),
  'browsers',
  'data',
  'chrome'
)
const ARGS = [`--port=${PORT}`]

const fetch = axios.create({
  baseURL: `http://localhost:${PORT}/session`,
})

let wdServer = null
let sessionId = null

;(async function () {
  let PASSED = false

  try {
    const USER_DIR = path.join(
      path.dirname(__dirname),
      'browsers',
      'data',
      'chrome'
    )
    /**
     * create session
     */
    await createSession()

    /**
     * navigate to url
     */
    await navigateTo('https://jankaritech.com')

    /**
     * get page title
     */
    const title = await getTitle()
    assert.equal(title, 'JankariTech')

    PASSED = true
  } catch (e) {
    console.log(e)
  } finally {
    /**
     * delete session
     */
    if (sessionId) {
      await closeSession()
    }

    if (PASSED) {
      console.info('[OK] Tests passed!')
    } else {
      console.error('[FAILED] Tests failed!')
    }
  }
})()

/**
 *
 * Setup
 *
 */

function startChromeDriver() {
  wdServer = spawn(CHROME_DRIVER_PATH, ARGS, {
    detached: true,
  })
}

/**
 *
 * APIs
 *
 */
async function createSession() {
  startChromeDriver()

  while (!sessionId) {
    await fetch({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        capabilities: {
          alwaysMatch: {
            browserName: 'chrome',
            'goog:chromeOptions': {
              binary: CHROME_EXECUTABLE_PATH,
              args: [`--user-data-dir=${USER_DIR}`],
            },
          },
        },
      },
    })
      .then(({ data }) => {
        sessionId = data.value.sessionId
      })
      .catch((e) => {
        throw new Error(e)
      })
  }

  return Promise.resolve()
}

async function navigateTo(url) {
  return fetch({
    method: 'POST',
    url: `/${sessionId}/url`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      url,
    },
  }).catch((e) => {
    throw new Error(e)
  })
}

async function getTitle() {
  let title
  await fetch({
    method: 'GET',
    url: `/${sessionId}/title`,
  })
    .then(({ data }) => (title = data.value))
    .catch((e) => {
      throw new Error(e)
    })
  return title
}

async function closeSession() {
  await fetch({
    method: 'DELETE',
    url: `/${sessionId}`,
  }).catch((e) => {
    throw new Error(e)
  })

  // close chromedriver server
  process.kill(-wdServer.pid)
}
