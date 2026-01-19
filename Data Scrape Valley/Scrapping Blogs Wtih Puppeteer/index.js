import { Puppeteer } from "puppeteer";
import { joshComeau } from "./joshComeau.js";
import { overreacted } from "./overreacted.js";
import { swizec } from "./swizec.js";

const main = async () => {
    joshComeau();
    // overreacted(); <= Changed Site Structure
    swizec(); // Auto Generated Classes That Need To Be Updated
}

main();