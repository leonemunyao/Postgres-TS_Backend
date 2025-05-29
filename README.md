## Postgres-TS_Backend

### Description

A robust e-commerce backend built with Node.js, Express, TypeScript, and PostgreSQL, specifically designed for a Kenyan shoe store with M-Pesa integration.

#### Table of Contents

* Features
* Prerequisites
* Installation
* Environment Variables
* Database Setup
* API Documentation
* Authentication
* Payment Integration
* Error Handling

##### Features

* User Authentication (JWT)
* Role-based Authorization (Admin/Customer)
* Product Management
* Category Management
* Shopping Cart
* Order Processing
* M-Pesa Payment Integration (Still Under Development)
* Shipping Management
* Search Functionality

##### Prerequisites

    Node.js (v14 or higher)
    PostgreSQL
    Redis
    npm or yarn


##### Installation

1. Clone the repository `git@github.com:leonemunyao/Postgres-TS_Backend.git`  `cd Backend`
2. Install dependanxies `npm install`
3. Set up environment variables:  `.env`
4. Initialize the Database `npx prisma migrate dev`
5. Create Admin User `npm run create-admin`
6. Start Development Server `npm run dev`


##### Database Setup

The application uses Prisma ORM with PostgreSQL. Models include:

* User
* Product
* Category
* Cart
* Order
* Payment
* Shipping

##### API Documentation

Public Routes

    POST /api/auth/register - Register new user
    POST /api/auth/login - User login
    GET /api/products - Get all products
    GET /api/categories - Get all categories

Protected Routes

    POST /api/cart/add - Add item to cart
    GET /api/cart - Get user's cart
    POST /api/orders - Create order
    POST /api/payments/mpesa/initiate - Initiate M-Pesa payment

Admin Routes

    GET /api/admin/users - Get all users
    PATCH /api/admin/orders/:id/status - Update order status
    POST /api/admin/products - Create product

##### Authentication Flow
1. User registers/logs in
2. JWT token issued
3. Token used for protected routes
4. Admin routes require admin role

##### Payment Process  (Still Under Development)
1. User checks out cart
2. Order created with 'pending' status
3. M-Pesa payment initiated
4. STK push sent to user's phone
5. Payment callback updates order status

##### Error Handling

* Validation errors: 400
* Authentication errors: 401
* Authorization errors: 403
* Not found errors: 404
* Server errors: 500












    
