# Warehouse-Based Stock Management System

A robust inventory management system with multi-warehouse support and advanced concurrency handling.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Database Design](#database-design)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Concurrency Handling](#concurrency-handling)
- [Test Results](#test-results)
- [Project Structure](#project-structure)
- [Performance](#performance)

---

## Overview

This system manages inventory across multiple warehouses with the following capabilities:

- Multi-warehouse stock tracking with separate stock levels per location
- Concurrent transaction handling using row-level database locking
- Complete stock IN/OUT operations with transaction history
- Prevention of negative stock through validation
- ACID-compliant database transactions ensuring data consistency

### Problem Statement

In manufacturing environments, concurrent stock operations can lead to:
- Race conditions when multiple users access the same stock simultaneously
- Negative stock values from concurrent withdrawals
- Data inconsistencies due to lost updates
- Inventory inaccuracies affecting production planning

### Solution

This system implements database transactions with `SELECT FOR UPDATE` row-level locking to ensure only one transaction can modify stock at a time, while other transactions wait in queue. This guarantees data consistency and prevents race conditions.

---

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Testing**: Jest, Supertest
- **Validation**: class-validator, class-transformer

---

## Key Features

### Core Functionality

- **Warehouse Management**: Create and manage warehouse locations
- **Sparepart Management**: Maintain master data of spare parts
- **Stock IN Operations**: Add inventory with automatic stock record creation
- **Stock OUT Operations**: Remove inventory with availability validation
- **Stock Query**: Real-time stock level checking per warehouse-sparepart combination
- **Transaction History**: Complete audit trail with filtering capabilities

### Technical Features

- **Row-Level Locking**: `SELECT FOR UPDATE` prevents race conditions
- **ACID Transactions**: Atomic operations with automatic rollback on failure
- **Input Validation**: Comprehensive DTO validation using class-validator
- **Clean Architecture**: Repository pattern with clear separation of concerns
- **Error Handling**: Structured error responses with appropriate HTTP codes
- **High Performance**: Tested with 50+ concurrent requests, achieving 70+ req/s throughput

---

## Database Design

### Entity Relationship Diagram

```
warehouses (1) ----< (M) warehouse_stocks (M) >---- (1) spareparts
     |                         |                           |
     |                         |                           |
     +----< stock_transactions >----------------------------+
```

### Tables

**warehouses**
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `code` (VARCHAR, UNIQUE)
- `created_at` (TIMESTAMP)

**spareparts**
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `sku` (VARCHAR, UNIQUE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**warehouse_stocks**
- `id` (UUID, Primary Key)
- `warehouse_id` (UUID, Foreign Key)
- `sparepart_id` (UUID, Foreign Key)
- `current_stock` (INTEGER)
- `updated_at` (TIMESTAMP)
- **UNIQUE CONSTRAINT**: (warehouse_id, sparepart_id)

**stock_transactions**
- `id` (UUID, Primary Key)
- `warehouse_id` (UUID, Foreign Key)
- `sparepart_id` (UUID, Foreign Key)
- `type` (ENUM: IN, OUT)
- `quantity` (INTEGER)
- `created_at` (TIMESTAMP)

### Design Principles

- Single source of truth: Stock levels stored only in `warehouse_stocks` table
- Unique constraint ensures one stock record per warehouse-sparepart combination
- Foreign key constraints maintain referential integrity
- Transaction history provides complete audit trail

---

## Installation

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 15 or higher
- npm or yarn package manager

### Setup Steps

1. Clone the repository
```bash
git clone <repository-url>
cd warehouse-stock-management
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/warehouse_db"
NODE_ENV=development
PORT=3000
```

4. Run database migrations
```bash
npx prisma migrate dev
```

5. Generate Prisma Client
```bash
npx prisma generate
```

---

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/db |
| NODE_ENV | Application environment | development, production |
| PORT | Application port | 3000 |



This starts a PostgreSQL instance accessible at `localhost:5432`.

---

## Running the Application

### Development Mode

```bash
npm run start:dev
```

API will be available at `http://localhost:3000`

### Production Mode

```bash
npm run build
npm run start:prod
```

### Database Management

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio
```

---

## API Endpoints

### Warehouse Operations

**Create Warehouse**
```http
POST /warehouses
Content-Type: application/json

{
  "name": "Central Warehouse Jakarta",
  "code": "WH-JKT-01"
}
```

**Get All Warehouses**
```http
GET /warehouses
```

**Get Warehouse by ID**
```http
GET /warehouses/:id
```

### Sparepart Operations

**Create Sparepart**
```http
POST /spareparts
Content-Type: application/json

{
  "name": "Engine Oil Filter",
  "sku": "SP-ENG-001"
}
```

**Get All Spareparts**
```http
GET /spareparts
```

**Get Sparepart by ID**
```http
GET /spareparts/:id
```

### Stock Operations

**Stock IN - Add Inventory**
```http
POST /stock/in
Content-Type: application/json

{
  "warehouseId": "uuid",
  "sparepartId": "uuid",
  "quantity": 100
}
```

Response (201):
```json
{
  "id": "transaction-uuid",
  "warehouseId": "uuid",
  "sparepartId": "uuid",
  "type": "IN",
  "quantity": 100,
  "createdAt": "2025-01-05T10:30:00Z"
}
```

**Stock OUT - Remove Inventory**
```http
POST /stock/out
Content-Type: application/json

{
  "warehouseId": "uuid",
  "sparepartId": "uuid",
  "quantity": 50
}
```

Error Response (400 - Insufficient Stock):
```json
{
  "statusCode": 400,
  "message": "Insufficient stock. Available: 30, Requested: 50",
  "error": "Bad Request"
}
```

**Get Current Stock**
```http
GET /stock?warehouseId=uuid&sparepartId=uuid
```

Response (200):
```json
{
  "id": "stock-uuid",
  "warehouseId": "uuid",
  "sparepartId": "uuid",
  "currentStock": 150,
  "updatedAt": "2025-01-05T10:30:00Z"
}
```

**Get Stock History**
```http
# All transactions
GET /stock/history

# Filter by warehouse
GET /stock/history?warehouseId=uuid

# Filter by sparepart
GET /stock/history?sparepartId=uuid

# Filter by both
GET /stock/history?warehouseId=uuid&sparepartId=uuid
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run concurrency tests
npm run test:e2e stock.concurrency
```

### Test Coverage

The test suite includes:

- **Unit Tests**: Individual components (controllers, services, repositories)
- **Integration Tests**: Complete API flows with database operations
- **Concurrency Tests**: Race condition prevention and data consistency verification
- **Edge Case Tests**: Validation rules and error handling

### Concurrency Test Scenarios

1. **Concurrent Stock Out**: Two simultaneous stock reduction requests
2. **Negative Stock Prevention**: Multiple requests attempting to exceed available stock
3. **Mixed Operations**: Concurrent stock IN and OUT operations
4. **Warehouse Isolation**: Verification that operations on different warehouses don't interfere
5. **High Load**: System behavior under 10 concurrent requests
6. **Extreme Load**: System behavior under 50 concurrent requests

---

## Concurrency Handling

### The Problem

When two users attempt to withdraw stock simultaneously:

```
Initial Stock: 100
User A: Withdraw 60
User B: Withdraw 60

WITHOUT PROPER LOCKING:
- Both users read stock = 100
- Both proceed with withdrawal
- Final stock = -20 (incorrect)

WITH ROW-LEVEL LOCKING:
- User A locks the row and withdraws 60
- User B waits for lock release
- User A commits (stock = 40)
- User B attempts withdrawal
- System detects insufficient stock
- User B's transaction is rejected
- Final stock = 40 (correct)
```

### Implementation

The system uses PostgreSQL's row-level locking mechanism through `SELECT FOR UPDATE`:

```typescript
await this.prisma.$transaction(async (tx) => {
  // Lock the specific stock record
  const stockRows = await tx.$queryRawUnsafe(
    `SELECT * FROM warehouse_stocks 
     WHERE warehouse_id = $1 AND sparepart_id = $2 
     FOR UPDATE`,
    warehouseId,
    sparepartId
  );

  // Validate stock availability
  if (stock.currentStock < quantity) {
    throw new BadRequestException('Insufficient stock');
  }

  // Update stock level
  await tx.warehouseStock.update({
    where: { id: stock.id },
    data: { currentStock: stock.currentStock - quantity }
  });

  // Record transaction
  await tx.stockTransaction.create({
    data: { type: 'OUT', quantity, ... }
  });
});
```

### Transaction Flow

```
1. BEGIN TRANSACTION
2. SELECT ... FOR UPDATE (acquire row lock)
3. VALIDATE
   - Stock record exists?
   - Sufficient quantity available?
4. If validation fails → ROLLBACK
5. UPDATE stock level
6. INSERT transaction record
7. COMMIT (release lock)
```

### Key Mechanisms

- **Row-Level Locking**: Only the specific stock record is locked, not the entire table
- **Serialization**: Concurrent requests are processed sequentially for the same stock
- **Atomicity**: All operations within a transaction succeed or fail together
- **Isolation**: Operations on different warehouses can proceed concurrently

---

## Test Results

### Concurrency Test Summary

All critical scenarios passed with 100% data consistency:

```
Test Suite: Stock Concurrency Tests

1. Concurrent Stock Out (2 requests)
   Total Requests: 2
   Success: 2 (100.0%)
   Duration: 387ms
   Throughput: 5.17 req/s
   Final Stock: 30
   Status: PASSED

2. Prevent Negative Stock (3 competing requests)
   Total Requests: 3
   Success: 1 (33.3%)
   Failed: 2 (66.7%) - Expected behavior (insufficient stock)
   Duration: 60ms
   Throughput: 50.00 req/s
   Final Stock: 20 (never negative)
   Status: PASSED

3. Mixed Stock IN/OUT Operations
   Total Requests: 4
   Success: 4 (100.0%)
   Duration: 191ms
   Throughput: 20.94 req/s
   Final Stock: 100
   Status: PASSED

4. Warehouse Isolation Test
   Total Requests: 4
   Success: 4 (100.0%)
   Duration: 24ms
   Throughput: 166.67 req/s
   Warehouse 1: 70, Warehouse 2: 110
   Status: PASSED

5. High Concurrency Load (10 requests)
   Total Requests: 10
   Success: 6 (60.0%)
   Failed: 4 (40.0%) - Expected (stock depleted)
   Duration: 110ms
   Throughput: 90.91 req/s
   Final Stock: 10 (never negative)
   Status: PASSED

6. Extreme Load Test (50 requests)
   Total Requests: 50
   Success: 50 (100.0%)
   Duration: 266ms
   Throughput: 187.97 req/s
   Final Stock: 300
   Formula Verification: 500 + 100 - 300 = 300
   Status: PASSED

OVERALL STATISTICS
Total Test Cases: 6
Total Requests: 73
Total Success: 67 (91.8%)
Total Failed: 6 (8.2%)
Total Duration: 1038ms (1.04s)
Average Duration: 173.00ms per test
Overall Throughput: 70.33 req/s
Data Consistency: 100% PASSED

Result: ALL TESTS PASSED
```

### Performance Metrics

| Metric | Value |
|--------|-------|
| Data Consistency | 100% |
| Overall Throughput | 70.33 req/s |
| Peak Throughput | 187.97 req/s (50 concurrent requests) |
| Average Response Time | 173ms |
| Negative Stock Prevention | 100% (verified across all tests) |
| Race Condition Prevention | 100% (verified across all tests) |

---

## Project Structure

```
warehouse-stock-management/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── warehouses/
│   │   ├── warehouses.controller.ts
│   │   ├── warehouses.service.ts
│   │   ├── warehouses.repository.ts
│   │   ├── warehouses.module.ts
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── constants/
│   ├── spareparts/
│   │   ├── spareparts.controller.ts
│   │   ├── spareparts.service.ts
│   │   ├── spareparts.repository.ts
│   │   ├── spareparts.module.ts
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── constants/
│   ├── stock/
│   │   ├── stock.controller.ts
│   │   ├── stock.service.ts
│   │   ├── stock.repository.ts
│   │   ├── stock.module.ts
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── constants/
│   └── shared/
│       ├── interceptors/
│       ├── filters/
│       └── interfaces/
├── test/
│   ├── helpers/
│   │   └── concurrency-reporter.ts
│   └── stock.concurrency.spec.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## Performance

### Optimization Techniques

- Database indexes on foreign key columns for fast lookups
- Unique constraints for duplicate prevention
- Connection pooling managed by Prisma
- Minimal lock duration (only during critical operations)
- Warehouse isolation (different warehouses don't block each other)

### Benchmarks

- Single request average: 173ms
- Concurrent 10 requests: 90.91 req/s
- Concurrent 50 requests: 187.97 req/s
- Warehouse isolation operations: 24ms

---

## Architecture

### Design Patterns

**Repository Pattern**
```
Controller → Service → Repository → Database
```
Separates data access logic from business logic for better testability and maintainability.

**DTO Pattern**
```
Request → Validation → Transform → Business Logic
```
Ensures type safety and input validation at the application boundary.

**Clean Architecture Layers**
```
Presentation Layer (Controller)
Business Logic Layer (Service)
Data Access Layer (Repository)
Database Layer (Prisma/PostgreSQL)
```

### Error Handling

The API returns structured error responses with appropriate HTTP status codes:

```json
{
  "statusCode": 400,
  "message": "Insufficient stock. Available: 50, Requested: 100",
  "error": "Bad Request"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation errors, insufficient stock)
- 404: Not Found (warehouse, sparepart, or stock not found)
- 409: Conflict (duplicate code or SKU)
- 500: Internal Server Error

### Validation Rules

**Warehouse:**
- name: 3-100 characters
- code: 2-20 characters, uppercase alphanumeric with hyphens, unique

**Sparepart:**
- name: 3-200 characters
- sku: 2-50 characters, uppercase alphanumeric with hyphens, unique

**Stock Operations:**
- quantity: Integer between 1 and 999,999
- warehouseId: Valid UUID, must exist in database
- sparepartId: Valid UUID, must exist in database

---

## Security

- Parameterized queries prevent SQL injection
- Input validation on all endpoints using class-validator
- TypeScript strict mode for type safety
- Database constraints enforce data integrity
- Row-level locking prevents race conditions
- Error messages don't expose sensitive system information

---

## License

This project is licensed under the MIT License.

---

## Contact

**Project**: Warehouse Stock Management System  
**Purpose**: Technical Test - Software Engineer Internship  
**Company**: OPPO Manufacturing Indonesia

For questions or support, please open an issue in the repository.

---

Built with NestJS, Prisma, and PostgreSQL