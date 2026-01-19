import puppeteer, { Page } from "puppeteer"
import * as fs from "fs"

interface PayorData {
  payorID: string
  payorName: string
  eClaims: boolean
  SpecialEnrollment: boolean
  attachments: boolean
  eligibility: boolean
  realTime: boolean
  ERA: boolean
  ERAEnrollment: boolean
}

const URL_DENTRIX = "https://www.dentrix.com/products/eservices/eclaims/payor-search-tool"

// Function to scrape data from a single page
async function scrapeDataFromPage(page: Page) {
  const pageResult = await page.evaluate(() => {
    // Select the table body
    const table = document.querySelector("#payorResults tbody")
    if (!table) return []
    // Get all rows in the table
    const rows = table.querySelectorAll("tr")
    const data: PayorData[] = []
    // Iterate over each row, skipping the header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const cells = row.querySelectorAll("td")

      // Push scraped data into data array
      data.push({
        payorID: cells[0]?.innerText || "",
        payorName: cells[1]?.innerText || "",
        eClaims:
          cells[2]
            ?.querySelector("span")
            ?.querySelector("i")
            ?.classList.contains("glyphicon-check") || false,
        SpecialEnrollment:
          cells[3]
            ?.querySelector("span")
            ?.querySelector("i")
            ?.classList.contains("glyphicon-check") || false,
        attachments:
          cells[4]
            ?.querySelector("span")
            ?.querySelector("i")
            ?.classList.contains("glyphicon-check") || false,
        eligibility:
          cells[5]
            ?.querySelector("span")
            ?.querySelector("i")
            ?.classList.contains("glyphicon-check") || false,
        realTime:
          cells[6]
            ?.querySelector("span")
            ?.querySelector("i")
            ?.classList.contains("glyphicon-check") || false,
        ERA:
          cells[7]
            ?.querySelector("span")
            ?.querySelector("i")
            ?.classList.contains("glyphicon-check") || false,
        ERAEnrollment:
          cells[8]
            ?.querySelector("span")
            ?.querySelector("i")
            ?.classList.contains("glyphicon-check") || false,
      })
    }
    return data
  })
  return pageResult
}

// Main scraping function
const dentrix = async () => {
  // Launch the browser & go to the URL
  const browser = await puppeteer.launch({ headless: false })
  let result: PayorData[] = []
  const page = await browser.newPage()
  await page.goto(URL_DENTRIX)

  // Loop until we reach last page
  while (true) {
    // Scrape data from the current page
    let pageResult = await scrapeDataFromPage(page)
    result.push(...pageResult)

    // Check if there is a next page
    const nextButton = await page.$('.pagination li a[rel="next"]')
    if (nextButton) {
      // If there is a next page, navigate to it
      await Promise.all([
        nextButton.click(),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
      ])
    } else {
      break
    }
  }

  console.log("Total records scraped:", result.length)
  await browser.close()

  // Write the scraped data to a JSON file
  fs.writeFile(
    "./extractedData/dentrix.json",
    JSON.stringify(result, null, 2),
    (err: any) => {
      if (err) throw err
      console.log("The file has been saved!")
    }
  )
}

export default dentrix
