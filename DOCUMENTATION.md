# 🛡️ CrowdPay: Technical Documentation & Product Overview

## 1. Project Vision
CrowdPay is a communal savings and social commerce platform designed to digitize the traditional **Ajo/Esusu** systems common across Africa. By integrating identity verification and decentralized governance, we eliminate the "Trust Gap" that often leads to defaults and fraud in communal saving groups.

## 2. Problem Statement
In traditional communal savings:
- **Default Risk**: Members may collect their payout and stop contributing.
- **Opacity**: There is no immutable record of who has paid and who hasn't.
- **Identity Fraud**: No formal verification of members.

## 3. The Solution: CrowdPay Architecture

### A. Identity-First Security (Interswitch Integration)
We leverage the **Interswitch Marketplace APIs** for 1:1 Identity Verification. 
- **KYC Tiers**: Every user must verify their NIN/Phone number before creating or joining a high-value Jar.
- **Fraud Prevention**: By linking profiles to verified identities, we create a "Trust Score" (Phase 2) that discourages defaults.

### B. Democratic Governance (The "No Cap" Protocol)
Unlike traditional apps where a "Creator" controls the money, CrowdPay implements **Unanimous Consensus**:
- **Withdrawal Voting**: For collaborative jars, funds can only be withdrawn if **all members** vote "Approved".
- **Immutable Ledger**: Every vote and transaction is recorded in a real-time Firestore ledger, visible to all members.

### C. Merchant Hub Integration
CrowdPay isn't just for saving; it's for **spending with purpose**.
- **Product-Linked Jars**: Users can save specifically for a product (e.g., a Laptop) from a verified vendor.
- **Automated Settlement**: Once the goal is reached and the group approves, funds are programmatically settled to the Merchant's wallet, deducting a **5% platform commission** and **₦200 service fee**.

## 4. Technical Deep Dive

### State Machine: The Ajo Rotation
The **Ajo Rotation Logic** manages complex payout schedules:
- **Rotation Order**: Determined by join-order or random shuffle upon jar activation.
- **Cycle Management**: Automated reset of the jar state once the "Cycle Leader" has disbursed funds to the final member in the rotation.

### Financial Syncing
- **Interswitch WebPAY**: Secure wallet funding.
- **Firestore Listeners**: Real-time balance updates and transaction logging ensure the UI is always in sync with the ledger.

## 5. Deployment & Scalability
- **Frontend**: Hosted on Vercel for low-latency delivery.
- **Backend API**: Serverless Functions (Node.js) handle secure API handshakes with Interswitch.
- **Security**: Environment variables protect client secrets and private API keys.

## 6. Roadmap
- **Phase 1 (MVP)**: Core Jar logic, Identity, and Merchant settlements.
- **Phase 2 (Growth)**: Crowd-Lending (Borrowing against Jar collateral).
- **Phase 3 (Enterprise)**: Multi-sig insurance for high-value investment groups.

---
**Live MVP**: [https://crowdpayweb.vercel.app/](https://crowdpayweb.vercel.app/)
**GitHub**: [https://github.com/Fatokz/Talent-board](https://github.com/Fatokz/Talent-board)

*Prepared for IDC x Enyata Hackathon 2026.*
