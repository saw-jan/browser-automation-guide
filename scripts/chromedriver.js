/**
 * Chrome driver (WebDriver for Chrome)
 */
const axios = require('axios')
const assert = require('assert')

let sessionId
;(async function () {
  let PASSED = false

  try {
    /**
     * create session
     */
    sessionId = await createSession()

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
    // console.log(e)
  } finally {
    /**
     * delete session
     */
    await closeSession()

    if (PASSED) {
      console.info('[OK] Tests passed!')
    } else {
      console.error('[FAILED] Tests failed!')
    }
  }
})()

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * webdriver client
 */
const fetch = axios.create({
  baseURL: 'http://localhost:4444/session',
})

// APIs
async function createSession() {
  let sessionId
  await fetch({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      capabilities: {
        browserName: 'chrome',
      },
    },
  })
    .then(({ data }) => {
      sessionId = data.value.sessionId
    })
    .catch((e) => {
      throw new Error(e)
    })
  return sessionId
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
}
