CrowdPay: The Social Wallet of Unanimous Trust
CrowdPay is a decentralized social payment ecosystem built to bridge the "Trust Gap" in communal finance. By digitizing traditional savings models like Ajo, we ensure that group funds are never controlled by a single individual, but by the collective will of the group.

🚀 The Problem & Our "Unanimous" Solution
In traditional group contributions (weddings, birthdays, school fees), a single "Finance Lead" typically holds the funds in a personal account. This creates risks of mismanagement, lack of transparency, and social friction.

CrowdPay disrupts this by implementing a Unanimous Consent Protocol:

Secure Escrow: Funds are collected via Interswitch and held in a secure vault.

Democratic Governance: To withdraw funds, the creator must submit a "Withdrawal Request" with a specific reason or invoice.

100% Approval: Funds are only released if every single participant (100% consensus) digitally approves the request.

Transparency First: If anyone declines, they must provide a reason visible to the entire group, keeping everyone accountable.

🛠️ Built with the "Ship-Fast" Stack
We leveraged a high-performance, scalable architecture to move from concept to production in record time:

Frontend: React + Tailwind CSS (via Antigravity & v0.dev).

Backend: Vercel Serverless Functions (Node.js).

Database: Firebase Firestore (Real-time data synchronization).

Payments: Interswitch Payment Gateway & Payout APIs.

📦 Core Features (The Social Cards)
Our dashboard provides five default templates for immediate social utility:

💰 Ajo (Thrift Savings): Automated, democratic rotating credit.

🎂 Birthday/Gift Funds: Transparent pooling for celebrations.

🕊️ Burial Support: Community-led bereavement logistics.

📚 School Fees: Collaborative support for education.

🏠 Family Projects: Shared household and ancestral maintenance.

📐 Architecture & Flow
Initiation: User creates a group and sets a goal.

Collection: Members pay into the secure Interswitch Escrow.

Real-time Tracking: Firebase listeners update the "Progress Ring" for all members instantly.

Consensus: Withdrawal is requested; members vote "Approve" or "Decline".

Settlement: Upon unanimous approval, the Vercel function triggers the final Payout.

⚡ Setup & Installation
(Note: To be completed on March 23rd)

Clone the repo: git clone https://github.com/Fatokz/Talent-board.git 
cd Talent-board/crowdpay

Install dependencies: npm install

Set up environment variables for Firebase and Interswitch.

Run locally: npm run dev