FieldPro 🔧

Your Trusted Field Service Management Platform

A comprehensive backend API for a field service management platform where customers can browse services, book technicians, make payments via bKash, and leave reviews. Built with Node.js, Express, TypeScript, PostgreSQL, and Prisma.

🔗 Live Links

Backend Repo: [GitHub Repository](https://github.com/Alamin4D/fieldpro-backend)

Live API: [Live Server URL](https://fieldpro-backend.vercel.app/)

API Docs: Postman Collection

Demo Video: Video Link

👤 Admin Credentials

Email: admin@gmail.com
Password: admin@12345

Replace the credentials above with your actual demo admin credentials before publishing the repository.

🛠️ Tech Stack

Technology

Purpose

Node.js

Runtime Environment

Express.js

Web Framework

TypeScript

Type Safety

PostgreSQL

Database

Prisma

ORM

JWT

Authentication

bKash

Payment Integration

bcrypt

Password Hashing

Zod

Request Validation

Redis

Token Caching

Postman

API Testing & Documentation

📦 Features

🔐 Authentication

User registration with role-based access

Email/password login

Google/GCP social login

JWT-based authentication

Protected routes

Role-based access control

Customer, Technician, and Admin roles

User status management

👤 Customer Features

Browse services

View technician profiles

View technician availability

Book technicians for specific services and time slots

View booking status

Cancel eligible bookings

Make payments via bKash

Verify payment status

View payment history

Leave reviews after completed and paid bookings

Update/delete own reviews

🔧 Technician Features

Create and update professional profile

Manage availability time slots

Prevent overlapping availability slots

View incoming bookings

Accept or reject bookings

Mark jobs as in-progress

Complete jobs

Manage technician availability status

🛡️ Admin Features

Dashboard statistics

View all users

Search and filter users

View individual user details

Activate/inactivate users

Ban/unban users

Delete users

View all bookings

View all payments

Monitor payment and booking activity

💳 Payment Integration

Real bKash payment integration

bKash payment creation

Hosted checkout flow

bKash callback handling

Payment execution

Payment status verification

Transaction ID tracking

Payment history

Redis-based bKash token caching

⭐ Review System

Customers can review completed bookings

Payment must be completed before reviewing

1–5 star rating

Optional comments

One review per booking

Customers can update their own reviews

Customers can delete their own reviews

Technician review listing

✅ Validation & Error Handling

Zod request validation

Centralized application errors

Consistent JSON response format

Proper HTTP status codes

Ownership validation

Business-rule validation

Role-based authorization

📊 Database Schema

Models

Model

Description

User

Stores user information, authentication data, role, and status

TechnicianProfile

Technician-specific professional information

Service

Services offered through the platform

Availability

Technician availability time slots

Booking

Service bookings between customers and technicians

Payment

Payment transactions and bKash payment information

Review

Customer reviews and ratings for technicians

Booking Status Flow

PENDING
   ↓
ACCEPTED
   ↓
IN_PROGRESS
   ↓
COMPLETED

Other possible states:

PENDING → REJECTED
PENDING → CANCELLED
ACCEPTED → CANCELLED
IN_PROGRESS → CANCELLED

Payment Status Flow

PENDING
   ↓
PAID

Other possible states:

PENDING → FAILED
PENDING → CANCELLED
PAID → REFUNDED

🏗️ Project Architecture

FieldPro follows a modular layered backend architecture:

Client / Postman
       ↓
     Routes
       ↓
   Middleware
       ↓
   Controller
       ↓
     Service
       ↓
   Prisma ORM
       ↓
   PostgreSQL

Project Structure

fieldpro-backend/
├── src/
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── service/
│   │   ├── technician/
│   │   ├── availability/
│   │   ├── booking/
│   │   ├── payment/
│   │   ├── review/
│   │   └── admin/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   └── schema.prisma
│
├── generated/
│   └── prisma/
│
├── .env
├── package.json
├── tsconfig.json
└── README.md

🔗 API Base URL

http://localhost:5000/api/v1

Production:

YOUR_DEPLOYED_API_URL/api/v1

🔐 Authentication API

POST /auth/register
POST /auth/login
POST /auth/google
GET  /auth/me
POST /auth/logout

🛠️ Service API

POST   /services
GET    /services
GET    /services/:id
PATCH  /services/:id
DELETE /services/:id

👨‍🔧 Technician API

POST  /technicians/profile
GET   /technicians/profile/me
PATCH /technicians/profile/me

PATCH /technicians/availability/toggle

GET   /technicians
GET   /technicians/:id

🕒 Availability API

POST   /availability
GET    /availability/my
GET    /availability/technician/:technicianId
PATCH  /availability/:id
DELETE /availability/:id

📅 Booking API

Customer

POST  /bookings
GET   /bookings/my
PATCH /bookings/:id/cancel
GET   /bookings/:id

Technician

GET   /bookings/technician/my
PATCH /bookings/:id/status

Booking Flow

Customer creates booking
        ↓
Technician accepts
        ↓
Customer makes payment
        ↓
Technician starts work
        ↓
IN_PROGRESS
        ↓
COMPLETED
        ↓
Customer leaves review

💳 Payment API

POST /payment/bkash/create
GET  /payment/bkash/callback
GET  /payment/my
GET  /payment/:id/verify
GET  /payment/:id

bKash Payment Flow

Create Booking
      ↓
Technician Accepts
      ↓
Create bKash Payment
      ↓
bKash Checkout
      ↓
bKash Callback
      ↓
Execute Payment
      ↓
Verify Payment
      ↓
Payment PAID

⭐ Review API

POST   /reviews
GET    /reviews/technician/:technicianId
GET    /reviews/:id
PATCH  /reviews/:id
DELETE /reviews/:id

Review Rules

Only customers can create reviews

Booking must belong to the customer

Booking must be COMPLETED

Payment must be PAID

One review per booking

Rating must be between 1 and 5

Customers can update/delete their own reviews

👑 Admin API

All admin endpoints require the ADMIN role.

Dashboard

GET /admin/dashboard

Users

GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id/status
DELETE /admin/users/:id

Bookings

GET /admin/bookings

Payments

GET /admin/payments

Admin Capabilities

User search

User filtering by role/status

User status management

User deletion

Booking monitoring

Payment monitoring

Revenue statistics

Platform statistics

📋 API Response Format

All API responses follow a consistent JSON structure.

Success Response

{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}

Error Response

{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}

🔒 Role-Based Access Control

Role

Access

CUSTOMER

Services, bookings, payments, reviews

TECHNICIAN

Profile, availability, bookings

ADMIN

User, booking, payment, and platform management

Example:

CUSTOMER  → /admin/users ❌
TECHNICIAN → /admin/users ❌
ADMIN     → /admin/users ✅

🚀 Getting Started

Prerequisites

Node.js 18+

PostgreSQL

Redis

bKash merchant/sandbox credentials

Google OAuth credentials

Installation

# Clone the repository
git clone https://github.com/Alamin4D/fieldpro-backend.git

# Go to project directory
cd fieldpro-backend

# Install dependencies
npm install

Environment Variables

Create a .env file:

NODE_ENV=development
PORT=5000

DATABASE_URL="YOUR_POSTGRESQL_DATABASE_URL"

APP_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"

BCRYPT_SALT_ROUNDS=12

JWT_ACCESS_SECRET="YOUR_ACCESS_SECRET"
JWT_REFRESH_SECRET="YOUR_REFRESH_SECRET"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"

GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"

ADMIN_NAME="Admin"
ADMIN_EMAIL="YOUR_ADMIN_EMAIL"
ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"

TECHNICIAN_NAME="Technician"
TECHNICIAN_EMAIL="YOUR_TECHNICIAN_EMAIL"
TECHNICIAN_PASSWORD="YOUR_TECHNICIAN_PASSWORD"

CUSTOMER_NAME="Customer"
CUSTOMER_EMAIL="YOUR_CUSTOMER_EMAIL"
CUSTOMER_PASSWORD="YOUR_CUSTOMER_PASSWORD"

REDIS_USER="YOUR_REDIS_USER"
REDIS_PASSWORD="YOUR_REDIS_PASSWORD"
REDIS_HOST="YOUR_REDIS_HOST"
REDIS_PORT="YOUR_REDIS_PORT"

BKASH_BASE_URL="YOUR_BKASH_BASE_URL"
BKASH_USERNAME="YOUR_BKASH_USERNAME"
BKASH_PASSWORD="YOUR_BKASH_PASSWORD"
BKASH_APP_KEY="YOUR_BKASH_APP_KEY"
BKASH_APP_SECRET="YOUR_BKASH_APP_SECRET"

BKASH_CALLBACK_URL="http://localhost:5000/api/v1/payment/bkash/callback"

Never commit real secrets, API keys, passwords, or .env files to GitHub.

🗄️ Database Setup

Generate Prisma Client:

npx prisma generate

Format Prisma schema:

npx prisma format

Run migration:

npx prisma migrate dev

Open Prisma Studio:

npx prisma studio

▶️ Run Locally

Development:

npm run dev

Build:

npm run build

Production:

npm start

Server:

http://localhost:5000

🧪 Testing

Postman is used for API testing.

Recommended testing flow:

1. Register/Login Customer
2. Register/Login Technician
3. Create Technician Profile
4. Create Availability
5. Browse Services
6. Create Booking
7. Login as Technician
8. Accept Booking
9. Create bKash Payment
10. Complete Payment
11. Verify Payment
12. Complete Booking
13. Create Review
14. Login as Admin
15. Test Dashboard
16. Test User Management
17. Test Booking Management
18. Test Payment Management
19. Test RBAC
20. Test Validation & Error Responses

⚡ Performance & Reliability

PostgreSQL indexes for frequently queried fields

Pagination for large collections

Prisma database transactions

Redis token caching

Parallel queries using Promise.all

Zod validation before business logic

Ownership checks

Role-based middleware

Centralized error handling

🌐 Deployment

Before deployment:

npm run build

Configure all required environment variables on the deployment platform.

Make sure:

PostgreSQL is accessible from production

Redis is accessible from production

bKash credentials are configured

Google Client ID is configured

JWT secrets are configured

CORS is configured

Production bKash callback URL is configured

Live API

YOUR_DEPLOYED_API_URL

📚 API Documentation

Postman Collection:

YOUR_POSTMAN_COLLECTION_URL

Swagger/OpenAPI:

YOUR_SWAGGER_DOCUMENTATION_URL

🎥 Demo Video

YOUR_DEMO_VIDEO_URL

The video demonstrates:

Project architecture

Authentication

Role-based authorization

Service management

Technician management

Availability management

Booking flow

bKash payment

Review system

Admin features

Validation and error handling

🔐 Security

FieldPro follows backend security practices including:

Password hashing with bcrypt

JWT authentication

Role-based authorization

Zod request validation

Environment-based secret management

Protected admin routes

Protected customer/technician routes

Resource ownership checks

Payment verification

Database constraints

👨‍💻 Author

Md Alamin Ahmed

Full Stack / MERN Stack Developer

Skills

React.js

Next.js

TypeScript

Node.js

Express.js

PostgreSQL

Prisma

MongoDB

JWT

REST API

Git & GitHub

📄 License

This project was developed for educational and portfolio purposes.

Copyright © 2026 Md Alamin Ahmed