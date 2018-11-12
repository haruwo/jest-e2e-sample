const chalk = require('chalk')
const NodeEnvironment = require('jest-environment-node')
const puppeteer = require('puppeteer')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

class PuppeteerEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config)
  }

  async setup() {
    await super.setup()

    console.log(chalk.yellow('Setup Test Environment.'))
    const wsEndpoint = fs.readFileSync(path.join(DIR, 'wsEndpoint'), 'utf8')

    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found')
    }

    // browser, newPage
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
    })
    this.global.__BROWSER__ = browser
    this.global.newPage = async () => this.wrapPage(await browser.newPage())

    // adminUrl
    const adminUrl = process.env['TARGET_URL'];
    if (!adminUrl) {
      throw new Error("Must presence environment of 'TARGET_URL', ex: 'https://host.of.target/path/to/target'")
    }
    this.global.__ADMIN_BASE_URL__ = adminUrl
    this.global.adminUrlOf = (spath) => adminUrl + spath

    // screenshot
    const screenshotDir = process.env['SCREENSHOT_TARGET']
    if (screenshotDir) {
      this.global.screenshot = {
        pathOf: async sp => {
          const p = path.join(screenshotDir, sp.replace(new RegExp("/+$"), "") + ".png")
          await fs.mkdirs(path.dirname(p))
          return p
        }
      }
    }
  }

  async teardown() {
    console.log(chalk.yellow('Teardown Test Environment.'))

    await super.teardown()
  }

  runScript(script) {
    return super.runScript(script)
  }

  async setupPage(page) {
    page.__errors__ = []
    page.errors = () => {
      return page.__errors__
    }
    page.clearErrors = () => {
      page.__errors__ = []
    }

    page.setViewport({
      width: 1366,
      height: 768,
    })

    for (let event of ['error', 'pageerror', 'requestfailed']) {
      await page.on(event, err => {
        page.__errors__.push({
          err,
          event,
        })
      })
    }

    await page.on('response', async r => {
      if (r.status() >= 400) {
        page.__errors__.push({
          status: r.status(),
          url: r.url(),
          text: await r.text(),
        })
      }
    })
  }

  async wrapPage(page) {
    await this.setupPage(page)

    //  return new Proxy(page, {
    //    apply: function(target, thisArg, argumentsList) {
    //      if (!target) {
    //        return undefined;
    //      }
    //
    //      return target.apply(thisArg, argumentsList)
    //    }
    //  })

    return page;
  }


}

module.exports = PuppeteerEnvironment

