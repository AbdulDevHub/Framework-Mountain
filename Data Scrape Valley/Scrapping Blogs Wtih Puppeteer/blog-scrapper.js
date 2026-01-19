import Puppeteer  from "puppeteer";
import fs from "fs";

const blogScraper = async (url, elements, titleElement) => {
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    // await page.screenshot({path: "screenshot.png"});

    const allArticles = await page.evaluate((allElementsSelector, titleSelector) => {
        const articles = document.querySelectorAll(allElementsSelector);
        
        return Array.from(articles).slice(0, 3).map((article) => {
            const title = article.querySelector(titleSelector).innerText;
            const url = article.querySelector("a").href;
            return {title, url};
        })
    }, elements, titleElement);
    console.log(allArticles);

    await browser.close()

    let urlObj = new URL(url);
    let siteName = urlObj.hostname.replace("www.", "").replace(".com", "");
    fs.writeFile(`extractedData/${siteName}.json`, JSON.stringify(allArticles), (err) => {
        if (err) throw err
        console.log("The file has been saved!")
    })
}

export { blogScraper };