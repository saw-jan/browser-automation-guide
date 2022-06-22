/**
 * Selenium WebDriver Client
 */
const { Builder, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const path = require('path')

const CHROME_DRIVER_PATH = path.join(
  path.dirname(__dirname),
  'drivers',
  'chromedriver'
)
const USER_DIR = path.join(
  path.dirname(__dirname),
  'browsers',
  'data',
  'chrome'
)
const CHROME_EXECUTABLE_PATH = path.join(
  path.dirname(__dirname),
  'browsers',
  'chrome',
  'chrome'
)

;(async function () {
  let PASSED = false
  try {
    // chromedriver service
    const service = new chrome.ServiceBuilder(CHROME_DRIVER_PATH)
      .setPort(4444)
      .build()

    chrome.setDefaultService(service)

    // create driver instance for chrome only
    // let driver = chrome.Driver.createSession(new chrome.Options(), service)

    // create driver instance
    // starts the server and creates a new session
    let driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(
        new chrome.Options()
          .setChromeBinaryPath(CHROME_EXECUTABLE_PATH)
          .addArguments([`--user-data-dir=${USER_DIR}`])
      )
      .build()

    await driver.get('https://jankaritech.com')
    await driver.wait(until.titleIs('JankariTech'), 1000)

    // delete session
    await driver.quit()

    PASSED = true
  } catch (e) {
    console.error(e)
  } finally {
    if (PASSED) {
      console.info('[OK] Tests passed!')
    } else {
      console.error('[FAILED] Tests failed!')
    }
  }
})()
