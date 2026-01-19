import * as fs from "fs"
import * as readline from "readline"

interface DentalXChangePayer {
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

interface DentrixPayer {
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

// Read the JSON files
let dentalXChangeData: Buffer = fs.readFileSync("extractedData/dentalXChange.json")
let dentrixData: Buffer = fs.readFileSync("extractedData/dentrix.json")

// Parse the JSON files
let dentalXChange: DentalXChangePayer[] = JSON.parse(dentalXChangeData.toString())
let dentrix: DentrixPayer[] = JSON.parse(dentrixData.toString())

// Function to compare the offerings of DentalXChange and Dentrix
function compareOfferings(
  payerID: string,
  dentalXChange: DentalXChangePayer[],
  dentrix: DentrixPayer[]
): void {
  console.log("DISCLAIMER: If the payer name on DentalXChange and Dentrix are different, their tables will be printed separately.\n")

  // Filter payers based on payerID
  let dxcPayers: DentalXChangePayer[] = dentalXChange.filter(
    (dxcPayer) => dxcPayer.payerID === payerID
  )
  let dentrixPayers: DentrixPayer[] = dentrix.filter(
    (dPayer) => dPayer.payorID === payerID
  )

  // If payerID not found in either DentalXChange or Dentrix
  if (dxcPayers.length === 0 && dentrixPayers.length === 0) {
    console.log(`Payer with ID ${payerID} not found in either DentalXChange or Dentrix.`)
    console.log('---------------------------------------------------------------------- \n')
    return
  }

  // Compare offerings of DentalXChange and Dentrix for each payer
  dxcPayers.forEach((dxcPayer) => {
    let dentrixPayer: DentrixPayer | undefined = dentrixPayers.find(
      (dPayer) => dPayer.payorName === dxcPayer.name
    )

    // Construct comparison table for current payer ID & Name
    let comparisonTable = [
      {
        Property: "Payer ID",
        DentalXChange: dxcPayer.payerID,
        Dentrix: dentrixPayer ? dentrixPayer.payorID : "Not Found",
      },
      {
        Property: "Payer Name",
        DentalXChange: dxcPayer.name,
        Dentrix: dentrixPayer ? dentrixPayer.payorName : "Not Found",
      },
      {
        Property: "Real Time Claim",
        DentalXChange: dxcPayer.realTimeClaim,
        Dentrix: dentrixPayer ? dentrixPayer.realTime : "Not Found",
      },
      {
        Property: "Real Time Claim Status",
        DentalXChange: dxcPayer.realTimeClaimStatus,
        Dentrix: "Not Found",
      },
      {
        Property: "Real Time Eligibility",
        DentalXChange: dxcPayer.realTimeEligibility,
        Dentrix: dentrixPayer ? dentrixPayer.eligibility : "Not Found",
      },
      {
        Property: "Real Time Benefits",
        DentalXChange: dxcPayer.realTimeBenefits,
        Dentrix: "Not Found",
      },
      {
        Property: "Electronic Attachments",
        DentalXChange: dxcPayer.electronicAttachments,
        Dentrix: dentrixPayer ? dentrixPayer.attachments : "Not Found",
      },
      {
        Property: "ERA",
        DentalXChange: dxcPayer.ERA,
        Dentrix: dentrixPayer ? dentrixPayer.ERA : "Not Found",
      },
      {
        Property: "ERA Enrollment",
        DentalXChange: "Not Found",
        Dentrix: dentrixPayer ? dentrixPayer.ERAEnrollment : "Not Found",
      },
      {
        Property: "Special Enrollment",
        DentalXChange: "Not Found",
        Dentrix: dentrixPayer ? dentrixPayer.SpecialEnrollment : "Not Found",
      },
    ]
    console.table(comparisonTable, ["Property", "DentalXChange", "Dentrix"])
  })

  // Output any remaining Dentrix payers not found in DentalXChange
  dentrixPayers.forEach((dPayer) => {
    let dxcPayer: DentalXChangePayer | undefined = dxcPayers.find(
      (dxcPayer) => dxcPayer.name === dPayer.payorName
    )
    
    if (!dxcPayer) {
      // Construct comparison table for current payer ID & Name
      let comparisonTable = [
        {
          Property: "Payer ID",
          DentalXChange: "Not Found",
          Dentrix: dPayer.payorID,
        },
        {
          Property: "Name",
          DentalXChange: "Not Found",
          Dentrix: dPayer.payorName,
        },
        {
          Property: "Real Time Claim",
          DentalXChange: "Not Found",
          Dentrix: dPayer.realTime,
        },
        {
          Property: "Real Time Claim Status",
          DentalXChange: "Not Found",
          Dentrix: "Not Found",
        },
        {
          Property: "Real Time Eligibility",
          DentalXChange: "Not Found",
          Dentrix: dPayer.eligibility,
        },
        {
          Property: "Real Time Benefits",
          DentalXChange: "Not Found",
          Dentrix: "Not Found",
        },
        {
          Property: "Electronic Attachments",
          DentalXChange: "Not Found",
          Dentrix: dPayer.attachments,
        },
        {
          Property: "ERA",
          DentalXChange: "Not Found",
          Dentrix: dPayer.ERA,
        },
        {
          Property: "ERA Enrollment",
          DentalXChange: "Not Found",
          Dentrix: dPayer.ERAEnrollment,
        },
        {
          Property: "Special Enrollment",
          DentalXChange: "Not Found",
          Dentrix: dPayer.SpecialEnrollment,
        },
      ]
      console.table(comparisonTable, ["Property", "DentalXChange", "Dentrix"])
    }
  })
  console.log('---------------------------------------------------------------------- \n')
}

// Create readline interface
const rl: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Function to prompt the user for a payer ID
function prompt(): void {
  rl.question("Enter a payer ID (e.g., '11271') or type 'exit' to quit: ", (payerID: string) => {
    if (payerID.toLowerCase() === "exit") {
      rl.close()
    } else {
      // Call the function with the user's input
      compareOfferings(payerID, dentalXChange, dentrix)
      // Prompt again for next payerID or to quit
      prompt()
    }
  })
}

// Start prompt for user input
prompt()
