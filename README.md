# 🛡️ VERITAS: Unified Agentic Financial Security & Agreement Engine
> **Built for the PayPal AI Hackathon 2026 (Devpost)**  
> **Categories Targeted**: Best Use of PayPal + AI ($5,000) • Best Use of Agentic Commerce ($5,000) • Most Impactful ($5,000) • Best Demo Delivery ($5,000) • Most Creative ($5,000) • Best Use of APIMatic ($1,000) • Best Use of AG Grid • Best Use of Render

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/Framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/Frontend-React_18_Vite-61DAFB.svg)](https://react.dev)
[![PayPal](https://img.shields.io/badge/PayPal-Orders_API_v2-003087.svg)](https://developer.paypal.com)
[![APIMatic](https://img.shields.io/badge/APIMatic-SDKs_&_Developer_Portal-007ACC.svg)](https://www.apimatic.io/)
[![AG Grid](https://img.shields.io/badge/Sponsor-AG_Grid-brightgreen)](https://www.ag-grid.com/)
[![Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Postman](https://img.shields.io/badge/Postman-API_Collection_v2.1-FF6C37.svg?logo=postman)](postman/argus_api_collection.json)

---

## 📌 Executive Summary

Digital financial interactions currently suffer from two opposing extremes:
1. **Unstructured Human Friction (Pre-Transaction)**: When people negotiate, share costs, or form informal agreements (e.g., group trips, split rent, freelance milestones), transactions stall due to ambiguity, social friction, and endless manual math.
2. **Autonomous Machine Exploitation (At-Transaction)**: When rogue merchants lure shoppers to typosquatted domains (`amaz0n.xy`, `appl-store.co`), users authorize payments with false trust, leaving buyers defrauded and payment networks trapped in 14-day dispute backlogs.

**VERITAS** resolves both crises on PayPal rails through two tightly unified subsystems:
* **ACCORD (Conversational Agreement & Consensus Engine)**: Turns raw, unstructured chat conversations into mathematically verified financial obligations, drives participants to 100% cryptographic consensus, and automatically executes atomic PayPal settlements.
* **ARGUS (Autonomous Pre-Settlement Fraud Interceptor)**: Inspects transaction intent in parallel (`< 30 ms`) using 4 autonomous workers to detect typosquatting, catalog mismatches, and price anomalies before funds capture—voiding scam authorizations in real-time.

---

## 🏗️ System Architecture

```
                                [ THE VERITAS PLATFORM ]
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
   [ ACCORD SUBSYSTEM ]                                             [ ARGUS SUBSYSTEM ]
Conversational Agreement Engine                               Autonomous Fraud Interceptor
         │                                                                   │
 1. Unstructured Chat Ingest                                        1. Intent: AUTHORIZE (< 10 ms)
    (WhatsApp / Group Chat / Text)                                     (Zero Buyer Checkout Latency)
         │                                                                   │
 2. Gemini AI Semantic Parser                                       2. 7-Day Conditional Cache
    (Extracts Facts, Debts, Quorums)                                   (DNS & TLS Hash Check)
         │                                                                   │
 3. Consensus Engine                                                3. Single-Flight Concurrency
    (Peer-to-Peer Agreement Tracker)                                   (4 Parallel Autonomous Workers:
         │                                                              - Domain Forensics
 4. 100% Consensus Reached                                              - Catalog Deep Crawler
         │                                                              - MSRP Price Floor Check
 5. One-Click PayPal Settlement                                         - Risk Synthesizer)
    (Debit/Credit Card + PayPal SDK)                                         │
                                                                    4. 3-Tier Settlement Action:
                                                                       - LOW RISK  -> Approve Capture
                                                                       - MED RISK  -> Buyer Warning
                                                                       - HIGH RISK -> Real-Time VOID &
                                                                                      Account Quarantine
```

---

## 🚀 Key Innovations

### 1. ACCORD: Conversational Consensus & Settlement
* **AI Chat-to-Contract Extraction**: Ingests multi-party chat transcripts and converts natural conversation into structured financial obligations and exact expense split matrices.
* **Consensus Quorum Verification**: Tracks explicit participant approval state. Funds are never settled until all parties confirm consensus.
* **Embedded PayPal Checkout Experience**: When consensus reaches 100%, users can immediately settle using the official PayPal JavaScript SDK, supporting both PayPal balance and standard Debit/Credit Cards.

### 2. ARGUS: Autonomous Pre-Settlement Fraud Interceptor
* **Asynchronous Pre-Settlement Hold (`intent: "AUTHORIZE"`)**: Buyers experience instantaneous checkout (< 10 ms). Inspection occurs in parallel before capture.
* **28 ms Autonomous Interception**: 4 specialized inspection workers execute in parallel to analyze domain entropy, brand mismatch, TLS certificate age, and MSRP pricing floors.
* **Zero Buyer Chargeback Guarantee**: Rogue transactions (e.g. `$120` shoes on `amaz0n.xy`) are VOIDED on PayPal rails before capture, eliminating the 14-day dispute cycle.
* **Enterprise SOC Portal with AG Grid**: Security operations dashboard featuring real-time transaction streaming, merchant risk scoring, audit ledgers, and dispute appeals.

---

## 💻 Tech Stack & Sponsor Integrations

| Technology | Role |
| :--- | :--- |
| **PayPal Orders API v2** | Two-phase settlement (`AUTHORIZE` ➔ `CAPTURE` / `VOID`) and client-side checkout buttons |
| **APIMatic** | Multi-language SDK generation (Python, TypeScript, C#, Java), OpenAPI 3.0 docs, and Developer Portal |
| **AG Grid Enterprise** | High-performance SOC monitoring grids, live audit ledger, and merchant appeals interface |
| **Google Gemini AI** | Natural language parsing, financial fact extraction, and ambiguity resolution |
| **FastAPI + Uvicorn** | High-throughput async backend with SQLite WAL storage and single-flight deduplication |
| **React 18 + TailwindCSS** | Modern unified web console for ACCORD agreement tracking and ARGUS threat intelligence |
| **Render** | Production cloud deployment blueprint via `render.yaml` |
| **Postman** | Complete automated API test suite across all pre-settlement and consensus endpoints |

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
* Python 3.11+
* Node.js 18+ (optional, static production frontend is pre-built)

### 1. Clone & Configure
```bash
git clone https://github.com/2006abhi9-stack/veritas.git
cd veritas
cp .env.example .env
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch VERITAS Unified Platform
```bash
python run_veritas.py
```
Open your browser at:
* **VERITAS Home**: [http://localhost:8000](http://localhost:8000)
* **ACCORD Agreement Engine**: [http://localhost:8000/accord](http://localhost:8000/accord)
* **ARGUS Fraud SOC**: [http://localhost:8000/argus](http://localhost:8000/argus)
* **Interactive API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📦 SDKs & Developer Experience (Powered by APIMatic)

VERITAS provides automated client SDKs generated via **APIMatic**:
* **OpenAPI 3.0 Contract**: [`docs/api-contracts.md`](docs/api-contracts.md) / `/openapi.json`
* **Supported Languages**: Python (`veritas-sdk`), TypeScript/Node.js, C#, and Java
* **Live Developer Portal**: Includes interactive API console and copy-paste code snippets for merchant gateways.

---

## 📮 API Verification with Postman

Import the test collection into Postman:
1. Open Postman ➔ Click **Import**.
2. Select `postman/argus_api_collection.json` and `postman/argus_environment.json`.
3. Run the automated collection runner to verify all PayPal authorization holds, fraud interceptions, and consensus workflows.

---

## 👥 The Team
Built with ❤️ for the **PayPal AI Hackathon 2026** by Team VERITAS.
