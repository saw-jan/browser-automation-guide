/**
 * Selenium WebDriver Client
 */
const { Builder, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const path = require('path')

const chromeDriver = path.join(
  path.dirname(__dirname),
  'drivers',
  'chromedriver'
)

;(async function () {
  // chromedriver service
  const service = new chrome.ServiceBuilder(chromeDriver).setPort(4444).build()

  chrome.setDefaultService(service)

  // create driver instance for chrome only
  // let driver = chrome.Driver.createSession(new chrome.Options(), service)

  // create driver instance
  // starts the server and creates a new session
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options())
    .build()

  await driver.get('https://jankaritech.com')
  await driver.wait(until.titleIs('JankariTech'), 1000)

  // delete session
  await driver.quit()
})()
