# InsideDesk Programming Project

## INTRODUCTION

The purpose of this project is to assess your programming abilities in order to
fulfill your duties at InsideDesk.

Your solution must use the [node](https://nodejs.org/en/) runtime, but you may use any libraries you need to solve the problem.

The project should be kept at 10 hours maximum of which you will be compensated
for your time regardless if InsideDesk decides to continue.

Do not worry if you do not complete all the steps in the alloted time frame.

## PROJECT

Your friend is a Dentist in the States who is trying to decide what Practice Management System (PMS) they should use for their dental practice.
They have narrowed it down to two options [Dentrix](https://www.dentrix.com/), and [DentalXChange](https://www.dentalxchange.com/home/Home).
They have asked you to find a way to compare the two PMSs to see which one will work best for their practice.

### STEP 1

Go to the [dentrix.com](https://www.dentrix.com/products/eservices/eclaims/payor-search) payer search tool, collect all the payers available, and as much information on them as possible.

![dentrix-payer-list](./screenshots/dentrix-payer-list.png "Dentrix Payer List")

### STEP 2

Go to the [dentalxchange.com](https://register.dentalxchange.com/reg/payerList?0) payer search tool, collect all the payers available, and as much information on them as possible.

![dental-exchange-list](./screenshots/dentalxchange-payer-list.png "DentalExchange Payer List")

### STEP 3

Write a tool to compare the offerings of the two different PMSs and the support available on a per payer basis.
The tool should be able to take some sort of input so that your friend can analyze the different aspects of each payer on their own.
Your friend is fairly tech-savvy so it doesn't need to be anything sophisticated (CLI is fine).

## CONCLUSION

Thanks for taking the time for the InsideDesk Programming Project. Your project
will be reviewed by members of the InsideDesk team.

Good Luck!

InsideDesk Dev Team.

## HOW TO RUN THE COMPLETED CODE

Follow these steps to set up and run the completed project on your local machine:

1) Install All Dependencies: `yarn`

2) Scrape Data From Both Sites: `yarn scrap` [This Has Already Been Done For You]

3) Start PMS Comparison Tool: `yarn start`
