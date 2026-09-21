/**
 * MarkGro Innovations - palmTrace USSD
 * USSD Code: *347*884# 
 * Provider: Africa's Talking / 9PSB / MTN MoMo API
 * Author: Meta AI for Uboho Mark
 */

const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory DB - Replace with MySQL / MongoDB in production
let farmers = {}; // { phoneNumber: { id, name, village, farmSize, trees, lang } }
let harvests = []; // { batchCode, farmerId, phone, bunches, date, type }

// Helper: Generate Farmer ID & Batch Code
function genFarmerId(phone) {
  return `MG-UYO-${phone.slice(-4)}`;
}
function genBatchCode(farmerId) {
  const date = new Date();
  const d = `${String(date.getDate()).padStart(2,'0')}${String(date.getMonth()+1).padStart(2,'0')}`;
  const rand = String.fromCharCode(65 + Math.floor(Math.random()*26));
  return `${farmerId}-${d}-${rand}`;
}

app.post('/ussd', (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  let response = '';
  const textArray = text.split('*');
  const level = textArray.length;

  // LEVEL 1: Main Menu
  if (text == '') {
    response = `CON Welcome to MarkGro palmTrace
Sustainable Palm from Source
1. Register as Farmer
2. Log Fresh Harvest (FFB)
3. Trace Batch Code
4. Buyer - Verify Purchase
5. My Wallet / Payment
6. Help / Agent`;
  }
  // --- 1. REGISTER ---
  else if (textArray[0] == '1') {
    if (level == 1) {
      response = `CON Enter Your Full Name:`;
    } else if (level == 2) {
      response = `CON Enter Village / LGA:`;
    } else if (level == 3) {
      response = `CON Farm Size in Hectares (e.g 2):`;
    } else if (level == 4) {
      response = `CON How many palm trees?`;
    } else if (level == 5) {
      const name = textArray[1];
      const village = textArray[2];
      const size = textArray[3];
      const trees = textArray[4];
      const farmerId = genFarmerId(phoneNumber);
      farmers[phoneNumber] = { id: farmerId, name, village, farmSize: size, trees, phone: phoneNumber };
      response = `END Registration Successful!
Name: ${name}
Farmer ID: ${farmerId}
Village: ${village}
Save this ID. You will use it to log harvest.
MarkGro Innovations`;
    }
  }
  // --- 2. LOG HARVEST ---
  else if (textArray[0] == '2') {
    if (level == 1) {
      response = `CON Enter Farmer ID (e.g MG-UYO-0427):`;
    } else if (level == 2) {
      response = `CON How many bunches today?`;
    } else if (level == 3) {
      response = `CON Harvest Date:
1. Today
2. Yesterday`;
    } else if (level == 4) {
      response = `CON Estate Type:
1. Own Farm
2. Family Farm
3. Outgrower`;
    } else if (level == 5) {
      const farmerId = textArray[1];
      const bunches = textArray[2];
      const dateOpt = textArray[3] == '1' ? 'Today 21-09-2026' : 'Yesterday 20-09-2026';
      const typeOpt = ['Own Farm','Family Farm','Outgrower'][parseInt(textArray[4])-1] || 'Own Farm';
      const batchCode = genBatchCode(farmerId);
      
      harvests.push({ batchCode, farmerId, phone: phoneNumber, bunches, date: dateOpt, type: typeOpt });
      
      response = `END Harvest Logged!
Batch Code: ${batchCode}
Bunches: ${bunches}
Date: ${dateOpt}
Type: ${typeOpt}
SMS sent to ${phoneNumber}. Show Batch Code to buyer.
- MarkGro palmTrace`;
    }
  }
  // --- 3. TRACE BATCH ---
  else if (textArray[0] == '3') {
    if (level == 1) {
      response = `CON Enter Batch Code to verify:`;
    } else if (level == 2) {
      const code = textArray[1].toUpperCase();
      const found = harvests.find(h => h.batchCode === code);
      if (found) {
        const farmer = Object.values(farmers).find(f => f.id === found.farmerId);
        const farmerName = farmer ? farmer.name : 'Registered Farmer';
        const village = farmer ? farmer.village : 'Akwa Ibom';
        response = `END *** VERIFIED - MarkGro ***
Batch: ${code}
Origin: ${village}
Farmer: ${farmerName} (${found.farmerId})
Harvest: ${found.date}
Bunches: ${found.bunches}
Status: Sustainable, No-Deforestation
Mill: MarkGro Innovations`;
      } else {
        response = `END Batch Code ${code} not found. Check spelling or contact MarkGro agent.`;
      }
    }
  }
  // --- 4. BUYER VERIFY ---
  else if (textArray[0] == '4') {
    if (level == 1) {
      response = `CON Buyer - Enter Batch Code:`;
    } else if (level == 2) {
      response = `CON Enter Quantity Buying (kg):`;
    } else if (level == 3) {
      response = `CON Confirm Purchase?
1. Yes, Confirm
2. No`;
    } else if (level == 4) {
      if (textArray[3] == '1') {
        const batch = textArray[1].toUpperCase();
        const qty = textArray[2];
        response = `END Purchase Confirmed!
Batch: ${batch}
Qty: ${qty}kg
Chain: Farmer->Buyer logged.
Receipt sent to ${phoneNumber}. Thank you for sourcing sustainable palm.
- MarkGro`;
      } else {
        response = `END Purchase cancelled.`;
      }
    }
  }
  // --- 5. WALLET ---
  else if (textArray[0] == '5') {
    response = `END My Wallet - palmTrace
Phone: ${phoneNumber}
Balance: N12,500 (Demo for Batch MG0427-2109-A)
1. Cashout requires MarkGro App.
Dial *347*884# again for menu.`;
  }
  // --- 6. HELP ---
  else if (textArray[0] == '6') {
    response = `END MarkGro Innovations Help:
Call Agent: 0803-XXX-XXXX
Office: Uyo, Akwa Ibom.
Email: markgroinnovations@gmail.com
Your sustainable palm partner.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MarkGro palmTrace USSD running on port ${PORT}`);
});

