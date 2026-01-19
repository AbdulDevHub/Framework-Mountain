import { blogScraper } from "./blog-scrapper.js";

const url = "https://overreacted.io";

const overreacted = async () => {
    blogScraper(url, "article", "h2");
}

export { overreacted };