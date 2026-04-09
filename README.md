# Demo Credit — Wallet Service

Demo Credit is a wallet service built for a mobile lending app. The idea is simple,  when someone gets a loan, they need somewhere to receive it. And when it's time to pay back, they need a way to send money. That's what this service does.

It handles four things: creating a user account, funding a wallet, transferring money to another user, and withdrawing funds. There's also a safety check for anyone who appears on the Lendsqr Adjutor Karma blacklist gets blocked from creating an account entirely.

---

## Table of Contents

- [How the App is Structured](#how-the-app-is-structured)
- [Entity-Relationship Diagram](#entity-relationship-diagram)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [API documentation (Swagger)](#api-documentation-swagger)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Design Decisions](#design-decisions)
- [Live URL](#live-url)

---

## How the App is Structured

Every request follows this path:

```
Request → Router → Middleware → Controller → Service → Model → MySQL
```

Each layer has one job and one job only:

- **Router** : decides which controller handles the request
- **Middleware** : checks the token, validates the input, catches errors
- **Controller** : receives the request, calls the right service, sends the response
- **Service** : where all the actual business logic lives
- **Model** : talks to the database using Knex
- **MySQL** : stores everything permanently

This separation means if something breaks, you know exactly which layer to look at.

---

## Entity-Relationship Diagram

ER Diagram

Three tables. That's all this service needs.

```
┌───────────────────────────┐         ┌─────────────────────────┐
│           users           │         │         wallets          │
├───────────────────────────┤         ├─────────────────────────┤
│ id            UUID PK     │────────►│ id          UUID PK     │
│ name          VARCHAR     │  1 : 1  │ user_id     UUID FK     │
│ email         VARCHAR     │         │ balance     DECIMAL     │
│ phone         VARCHAR     │         │ created_at  TIMESTAMP   │
│ password_hash VARCHAR NULL│         │ updated_at  TIMESTAMP   │
│ created_at    TIMESTAMP   │         └─────────────────────────┘
└───────────────────────────┘
                                            │
                                            │ 1 : many
                                            ▼
                              ┌───────────────────────────────┐
                              │         transactions          │
                              ├───────────────────────────────┤
                              │ id              UUID PK       │
                              │ wallet_id       UUID FK       │
                              │ type            ENUM          │
                              │  (fund|transfer|withdraw)     │
                              │ amount          DECIMAL       │
                              │ reference       VARCHAR       │
                              │ counterparty_id UUID NULL FK  │
                              │ metadata        JSON NULL     │
                              │ created_at      TIMESTAMP     │
                              └───────────────────────────────┘
```

**A few things worth noting about this design:**

- Every user gets exactly one wallet, that's the 1:1 relationship between users and wallets
- A wallet can have many transactions, every fund, transfer, and withdrawal creates a record
- When a transfer happens, two transaction rows are created — one for the sender, one for the receiver — each row has its own unique `reference` (the column is unique in the database)
- `balance` is stored as DECIMAL, not float. floats have rounding issues with money, DECIMAL does not
- All primary keys are UUIDs instead of auto-increment integers, harder to guess, better for distributed systems
- `transactions.metadata` is stored as TEXT (JSON string) for compatibility with hosted MySQL providers

---

## Project Structure

```
src/
├── config/
│   ├── db.ts               — Knex connection, created once and reused everywhere
│   └── env.ts              — reads and validates all environment variables on startup
├── controllers/
│   ├── auth.controller.ts  — handles register
│   └── wallet.controller.ts — handles fund, transfer, withdraw, balance, transactions
├── db/
│   ├── migrations/         — creates the database tables
│   └── seeds/              — test data for local development
├── middleware/
│   ├── auth.middleware.ts  — verifies the faux token on every protected route
│   ├── error.middleware.ts — catches all errors and returns a clean response
│   └── validate.middleware.ts — checks request body before it hits the controller
├── models/
│   ├── user.model.ts       — all database queries related to users
│   ├── wallet.model.ts     — all database queries related to wallets
│   └── transaction.model.ts — all database queries related to transactions
├── routes/
│   ├── index.ts            — combines all routes into one
│   ├── auth.routes.ts      — /auth endpoints
│   └── wallet.routes.ts    — /wallet endpoints
├── services/
│   ├── auth.service.ts     — registration logic including blacklist check
│   ├── wallet.service.ts   — fund, transfer, withdraw logic with transaction scoping
│   └── karma.service.ts    — calls the Adjutor API to check the blacklist
├── types/
│   └── index.ts            — TypeScript interfaces shared across the whole app
├── docs/
│   └── openapi.json        — OpenAPI 3 spec (Swagger UI loads this file)
└── utils/
    ├── response.ts         — every API response goes through here
    ├── errors.ts           — creates errors with HTTP status codes attached
    └── email.ts            — email validation + normalization

tests/
├── unit/
│   ├── auth.service.test.ts
│   ├── email.test.ts
│   └── wallet.service.test.ts
└── integration/
    ├── auth.routes.test.ts
    ├── wallet.routes.test.ts
    └── swagger.test.ts
```

---

## Tech Stack


|             | What              | Why                                                               |
| ----------- | ----------------- | ----------------------------------------------------------------- |
| Runtime     | Node.js 20 LTS    | Stable, production-ready, required by the assessment              |
| Language    | TypeScript        | Catches bugs at compile time instead of runtime                   |
| Framework   | Express           | Lightweight and straightforward                                   |
| ORM         | KnexJS            | Required by the assessment, gives you full control over your SQL  |
| Database    | MySQL             | Required by the assessment                                        |
| Testing     | Jest + Supertest  | Jest for unit tests, Supertest for hitting real HTTP endpoints    |
| Auth        | Faux Bearer token | The assessment says a full auth system is not needed              |
| HTTP Client | Axios             | Used to call the Adjutor Karma API                                |
| Passwords   | bcryptjs          | Passwords are hashed before storage; never returned in API bodies |
| API docs    | Swagger UI        | Served at `/api-docs` from `src/docs/openapi.json`                |


---

## API Reference

Every response from this API looks the same, success or failure:

```json
{
  "success": true,
  "message": "something readable",
  "data": {}
}
```

---

## API documentation (Swagger)

- **Swagger UI:** `GET /api-docs` (e.g. `http://localhost:3000/api-docs`)
- **OpenAPI JSON:** `src/docs/openapi.json` (same document the UI loads)

The spec documents **wallet**, **auth/register**, and **auth/login** endpoints. It intentionally does **not** include `GET /health` that route still exists on the server (`{ "status": "ok" }`) for uptime checks, but it is omitted from Swagger to keep the contract focused on wallet flows.

---

### Create an account

**POST /auth/register**

Passwords are validated (minimum length), **normalized emails** are required (not every string counts as an email), and the password is stored as a **bcrypt hash**, the plain password is **never** returned in JSON.

```json
{
  "name": "Fola Pena",
  "email": "fola@demo.com",
  "phone": "08012345678",
  "password": "your-secure-password"
}
```

Success `201`:

```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "user": { "id": "uuid", "name": "Fola Pena", "email": "fola@demo.com" },
    "token": "faux-token-<userId>"
  }
}
```

Blacklisted `403`:

```json
{
  "success": false,
  "message": "Account creation denied"
}
```

---

### Login

**POST /auth/login**

```json
{
  "email": "fola@demo.com",
  "password": "your-secure-password"
}
```

Success `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "name": "Fola Pena", "email": "fola@demo.com" },
    "token": "faux-token-<userId>"
  }
}
```

Invalid credentials `401`:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Wallet endpoints

All wallet routes need this header:

```
Authorization: Bearer faux-token-<your-token>
```


| Method | Path                 | What it does                     |
| ------ | -------------------- | -------------------------------- |
| GET    | /wallet/balance      | Returns your current balance     |
| GET    | /wallet/transactions | Returns your transaction history |
| POST   | /wallet/fund         | Adds money to your wallet        |
| POST   | /wallet/transfer     | Sends money to another user      |
| POST   | /wallet/withdraw     | Takes money out of your wallet   |


**Fund:**

```json
{ "amount": 5000 }
```

**Transfer:**

```json
{
  "recipient_email": "pelumi@demo.com",
  "amount": 1000
}
```

**Withdraw:**

```json
{ "amount": 2000 }
```

---

## Setup & Installation

```bash
# Clone the repo
git clone https://github.com/Pelumiade/demo-credit.git
cd demo-credit

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Open .env and fill in your database credentials and Adjutor API key

# Create the database in MySQL
mysql -u root -p
CREATE DATABASE demo_credit;
exit;

# Run migrations to create the tables
npm run migrate

# Start the server
npm run dev
```

---

## Environment Variables

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=demo_credit

ADJUTOR_API_KEY=your_adjutor_api_key
ADJUTOR_BASE_URL=https://adjutor.lendsqr.com/v2
```

---

## Running Tests

```bash
# Unit + integration tests (default)
npm test

# Optional: DB + HTTP end-to-end wallet flow (needs `demo_credit_test` + `npm run migrate:test`)
npm run test:e2e

# Coverage report
npm run test:coverage
```

The tests are split into layers:

- **Unit tests** : services and small helpers (e.g. email validation) with mocks.
- **Integration tests** : full HTTP stack with Supertest (routes, validation, Swagger smoke test).
- **E2E tests** (optional) : real MySQL database + real HTTP for balance math on fund / transfer / withdraw (`tests/e2e/`).

---

## Design Decisions

**Storing balance directly on the wallet instead of computing it from transactions**

The simplest approach for an MVP. The `wallets.balance` column is always up to date because it gets updated inside the same database transaction as the transaction record. No need to sum up transaction history every time someone checks their balance.

**Locking wallet rows with FOR UPDATE during any balance change**

Without this, two requests hitting the server at the exact same time could both read the same balance, both pass the funds check, and both write, leaving the balance in a broken state. The row lock forces them to wait for each other.

**Blocking registration when the Karma API is unreachable**

If Adjutor goes down and we cannot check the blacklist, we deny the registration rather than letting it through. Better to block a legitimate user temporarily than to let a blacklisted user slip through permanently.

**Keeping the Karma check in the service layer, not middleware**

It is a business rule that only applies to registration. Middleware is for cross-cutting concerns like auth and validation. Putting the Karma check in middleware would make it harder to test and harder to understand.

**All API responses go through one file**

`src/utils/response.ts` is the only place that calls `res.json()`. This means the response shape is always consistent. If the format needs to change, there is one place to change it.

**Password hashing even though access is faux-token based**

The assessment allows a faux Bearer token for API access, but registration still collects a password so credentials can exist for login. Passwords are hashed with **bcrypt** and only `password_hash` is stored, the API never returns the hash or the plain password.

**Stricter email validation**

Registration emails are validated beyond a single loose regex, then **trimmed and lowercased** so `User@Mail.com` and `user@mail.com` resolve to one account.

---

## Live URL

```
https://afolabi-adepena-lendsqr-be-test.onrender.com
```

---

## Karma Blacklist — Testing Note

The Karma check is wired up and calls the Adjutor API on every registration. The issue is that Adjutor only returns real blacklist data for accounts that have been KYC verified and  the API kept returning empty responses.

To get around this and still show the logic works, the email `blacklisted@demo.com` is hardcoded as a test blocked identity. Every other email still goes through the real Adjutor API call normally.

**To test it —register with this email:**

```json
POST /auth/register

POST /auth/register — blacklisted test

{
  "name": "Bad User",
  "email": "blacklisted@demo.com",
  "phone": "08099999999",
  "password": "password123"
}
```

Expected response:

```json
{
  "success": false,
  "message": "Account creation denied"
}
```

