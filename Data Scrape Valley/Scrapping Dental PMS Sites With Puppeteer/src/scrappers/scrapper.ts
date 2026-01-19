import dentalXChange from "./dentalXChange"
import dentrix from "./dentrix"

const main = async () => {
  console.log("Starting Dentrix scraping...")
  await dentrix()
  console.log("Dentrix scraping completed.\n")

  console.log("Starting DentalXChange scraping...")
  await dentalXChange()
  console.log("DentalXChange scraping completed.\n")

  console.log("All scraping tasks completed successfully.")
}

main().catch((error) => {
  console.error("An error occurred during the scraping process:", error)
})
