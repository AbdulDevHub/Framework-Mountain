import { Puppeteer } from "puppeteer";
import { blogScraper } from "./blog-scrapper.js";

const url = "https://swizec.com/blog";

const swizec = async () => {
    return await blogScraper(url, ".css-zo9vbf", "a");
}

export { swizec };