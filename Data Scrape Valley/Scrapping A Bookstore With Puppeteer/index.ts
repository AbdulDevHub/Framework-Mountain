const puppeteer = require("puppeteer")
const fs = require("fs")
import { Browser } from "puppeteer"

const url = "https://books.toscrape.com/"

const main = async () => {
  const browser: Browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(url)

  const bookData = await page.evaluate((url) => {
    const convertPrice = (price: string) => {
      return parseFloat(price.replace("£", ""))
    }

    const convertRating = (rating: string) => {
      switch (rating) {
        case "One":
          return 1
        case "Two":
          return 2
        case "Three":
          return 3
        case "Four":
          return 4
        case "Five":
          return 5
        default:
          return 0
      }
    }

    const bookPods = Array.from(document.querySelectorAll(".product_pod"))
    const data = bookPods.map((book: any) => ({
      title: book.querySelector("h3 a").getAttribute("title"),
      price: convertPrice(book.querySelector(".price_color").innerText),
      imgSrc: url + book.querySelector("img").getAttribute("src"),
      rating: convertRating(
        book.querySelector(".star-rating").classList.contains[1]
      ),
    }))

    return data
  }, url)
  console.log(bookData)

  await browser.close()

  fs.writeFile("data.json", JSON.stringify(bookData), (err: any) => {
    if (err) throw err
    console.log("The file has been saved!")
  })
}

main()
