# Payout Management MVP — Backend

Express + MongoDB REST API for payout management with JWT auth and role-based access control.

## Tech Stack

- Node.js, Express 5, Mongoose, bcryptjs, jsonwebtoken
- MongoDB Atlas (Free Tier)

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

## Setup & Run (under 5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI, port, and JWT secret (see below)

# 3. Seed users
node seed.js

# 4. Start server
npm start
```

Server runs at `http://localhost:4000`

## Environment Variables

Create a `.env` file in the root:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mvp
PORT=4000
JWT_SECRET=your_jwt_secret_here
```

## Seed Data

Run `node seed.js` to create two users:

| Email              | Password | Role    |
|--------------------|----------|---------|
| ops@demo.com       | ops123   | OPS     |
| finance@demo.com   | fin123   | FINANCE |

The seed script is idempotent — re-running it skips existing users.

## API Endpoints

| Method | Endpoint                      | Role Required | Description              |
|--------|-------------------------------|---------------|--------------------------|
| POST   | /api/auth/login               | —             | Login, returns JWT       |
| GET    | /api/vendors                  | OPS           | List all vendors         |
| POST   | /api/vendors                  | OPS           | Create a vendor          |
| GET    | /api/payouts                  | OPS, FINANCE  | List payouts (filterable)|
| POST   | /api/payouts                  | OPS           | Create payout (Draft)    |
| GET    | /api/payouts/:id              | OPS, FINANCE  | Get payout detail        |
| POST   | /api/payouts/:id/submit       | OPS           | Submit (Draft→Submitted) |
| POST   | /api/payouts/:id/approve      | FINANCE       | Approve (Submitted→Approved) |
| POST   | /api/payouts/:id/reject       | FINANCE       | Reject (Submitted→Rejected)  |

## Collections

- `users` — login credentials & roles
- `vendors` — vendor details (name, UPI, bank account, IFSC)
- `payouts` — payout requests with status workflow
- `payout_audits` — audit trail for every payout state change

## Assumptions

- Two roles only: OPS (creates/submits payouts, manages vendors) and FINANCE (approves/rejects payouts)
- JWT tokens expire after 8 hours
- Payout status flow: Draft → Submitted → Approved/Rejected (no reversal)
- Rejection requires a mandatory reason
- CORS is open (`origin: *`) for development
