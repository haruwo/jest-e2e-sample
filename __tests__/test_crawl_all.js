// 必須項目（含まれているべき文字列）
const menuEntries = [
  'XXX',
  'YYY',
  'ZZZ',
]

const cases = [
  {
    path: "/manage/",
    contains: ['INDEX'].concat(menuEntries)
  },
  {
    path: "/manage/page1",
    contains: ['PAGE1'].concat(menuEntries)
  },
  {
    path: "/manage/page2",
    contains: ['PAGE2'].concat(menuEntries)
  },
  {
    path: "/manage/page3",
    contains: ['PAGE3'].concat(menuEntries)
  },
]

const excludeErrorPatterns = [
  e => {
    return e &&
      e.status == 500 &&
      e.url && e.url.endsWith("/excluded/api/call") &&
      e.text && e.text.includes("excluded error message")
  },
]


describe('Crawl all pages', () => {
  let page

  const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

  beforeEach(async () => {
    page.clearErrors()
  })

  beforeAll(async () => {
    console.log("before all")

    if (!page) {
      page = await global.newPage()
    }
  })

  afterAll(async () => {
    await page.close()
  })

  for (let c of cases) {
    it(`${c.path} should load without error`, async () => {
      const url = global.adminUrlOf(c.path);
      console.log({
        url
      });
      await page.goto(url)

      let text = await page.evaluate(() => document.body.textContent)
      await sleep(1000);

      if (global.screenshot) {
        const p = await global.screenshot.pathOf(c.path)
        console.log(`Save screenshot to "${p}"`)
        await page.screenshot({
          path: p,
          fullPage: true,
        })
      }

      for (let expected of c.contains) {
        expect(text).toContain(expected)
      }
      expect(page.errors().filter(e => !excludeErrorPatterns.find(predicate => predicate(e)))).toEqual([])
    })
  }
})

