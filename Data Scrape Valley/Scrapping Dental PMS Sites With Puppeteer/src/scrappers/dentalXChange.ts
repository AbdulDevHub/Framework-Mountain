import puppeteer, { Page } from "puppeteer"
import * as fs from "fs"

interface PayerData {
  payerID: string
  name: string
  claim: boolean
  realTimeEligibility: boolean
  realTimeBenefits: boolean
  realTimeClaimStatus: boolean
  ERA: boolean
  realTimeClaim: boolean
  electronicAttachments: boolean
}

const URL_DENTALXCHANGE = "https://register.dentalxchange.com/reg/payerList?0"

// Function to get the total number of pages to be scraped
async function getTotalPages(page: Page) {
  // Select label that contains total number of data rows (ex. "Showing 1 to 25 of 1361")
  const totalRowsLabel = await page.$(
    "#id7 > tfoot > tr > td > div.navigatorLabel > span"
  )
  if (!totalRowsLabel) throw new Error("Total rows label not found.")

  // Extract the total number of rows
  const totalRows = await totalRowsLabel.evaluate((element) => {
    return element.innerText.trim() || null
  })

  // Calculate total number of pages based on total number of rows per page
  if (totalRows !== null) {
    const regex = /of\s+(\d+)$/
    const match = totalRows.match(regex)
    if (match) {
      const totalRowsFound = parseInt(match[1], 10)
      const totalPages = Math.ceil(totalRowsFound / 25)
      return totalPages
    }
  }
  throw new Error("Number not found in the expected format.")
}

// Function to scrape data from a single page
async function scrapeDataFromPage(page: Page) {
  const pageResult = await page.evaluate(() => {
    // Select the table body
    const table = document.querySelector(".table tbody")
    if (!table) return []

    // Get all rows in the table
    const rows = table.querySelectorAll("tr")
    const data = []
    
    // Scrape data from each row on page
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const cells = row.querySelectorAll("td")

      // Push scraped data into data array
      data.push({
        payerID: cells[0]?.querySelector("span")?.innerText ?? "",
        name: cells[1]?.querySelector("span")?.innerText ?? "",
        claim:
          cells[2]?.querySelector("span")?.classList.contains("fa-check") ||
          false,
        realTimeEligibility:
          cells[3]?.querySelector("span")?.classList.contains("fa-check") ||
          false,
        realTimeBenefits:
          cells[4]?.querySelector("span")?.classList.contains("fa-check") ||
          false,
        realTimeClaimStatus:
          cells[5]?.querySelector("span")?.classList.contains("fa-check") ||
          false,
        realTimeClaim:
          cells[6]?.querySelector("span")?.classList.contains("fa-check") ||
          false,
        ERA:
          cells[7]?.querySelector("span")?.classList.contains("fa-check") ||
          false,
        electronicAttachments:
          cells[8]?.querySelector("span")?.classList.contains("fa-check") ||
          false,
      })
    }
    return data
  })
  return pageResult
}

// Main scraping function
const dentalXChange = async () => {
  // Launch the browser & go to the URL
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  let result: PayerData[] = []
  await page.goto(URL_DENTALXCHANGE)

  // Get the total number of pages to be scraped
  const totalPages = await getTotalPages(page)
  console.log("Total Pages: ", totalPages)

  // Loop over and scrape data from all pages
  for (let start = 1; start <= totalPages; start++) {
    // Scrape data from the current page
    let pageResult = await scrapeDataFromPage(page)
    result.push(...pageResult)

    // Get the navigator label before the click
    const navigatorLabelBeforeClick = await page.evaluate(() => {
      const navigatorLabel = document.querySelector(
        "tfoot .navigation td .navigatorLabel span"
      )
      return (navigatorLabel as HTMLElement).innerText || ""
    })

    // If start not equal to last page, click "next page" button and wait for page to change
    if (start !== totalPages) {
      // Trigger the "next page" button's onclick event
      await page.evaluate(() => {
        const nextButton = document.querySelector('a[title="Go to next page"]')
        if (nextButton) {
          (nextButton as HTMLAnchorElement).click()
        }
      })

      // Wait until the navigator label has changed
      await page.waitForFunction(
        (navigatorLabel) => {
          const newNavigatorLabel = document.querySelector(
            "tfoot .navigation td .navigatorLabel span"
          )
          return navigatorLabel !== (newNavigatorLabel as HTMLElement).innerText
        },
        {},
        navigatorLabelBeforeClick
      )
    }
  }

  console.log("Total records scraped:", result.length)
  await browser.close()

  // Write the scraped data to a JSON file
  fs.writeFile(
    "./extractedData/dentalXChange.json",
    JSON.stringify(result, null, 2),
    (err: any) => {
      if (err) throw err
      console.log("The file has been saved!")
    }
  )
}

export default dentalXChange
