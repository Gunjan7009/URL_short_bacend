# 🔗 URL Shortener Backend

A full-stack URL shortener and analytics platform. This repository contains the **backend** built with **Node.js**, **Express**, and **MongoDB**, designed to work alongside a React frontend.

---
# Video Link

https://drive.google.com/file/d/1ecrHu3H5cfksxxkSXcRpHmGEhLC8QYxz/view?usp=sharing


## 🧩 Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Hosting**: Designed for deployment on platforms like Vercel, Render, or Railway

---

## 🚀 Core Features

- 🔐 **User Authentication** – Sign up and login with email/password
- 🔗 **URL Shortening** – Generate unique short links for user-provided URLs
- 📈 **Analytics** – Track visits: total clicks, timestamp, IP, user agent, device type
- 🌍 **Redirect Handling** – Supports both `/redirect/:shortId` and `/r/:shortId`
- ⏰ **Expiration Cleanup** – Scheduled daily cron job cleans up expired links
- 👤 **User Dashboard API** – Protected endpoints (`/urllist`, `/analytics/:shortId`) for logged-in users

---

## 🛠 Installation & Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/Gunjan7009/URL_short_bacend.git
   cd URL_short_bacend
Install dependencies

bash
Copy
Edit
npm install
Create a .env file in the root directory:

env
Copy
Edit
PORT=8005
MONGODB_URL=your-mongodb-uri
JWT_SECRET=your-secure-jwt-secret
Start the server

bash
Copy
Edit
npm start
The server will connect to MongoDB, then listen on http://localhost:8005.

🧭 Available API Endpoints
🔐 Auth Routes (/auth)
POST /auth/register – Register a new user
Body: { name, email, mobile, password, confirmpassword }

POST /auth/login – User login

GET /auth/me – Get current logged-in user (requires JWT header)

🔗 URL & Analytics (/url)
POST /url – Create a shortened URL (protected)

GET /urllist – List all short URLs by user (protected)

GET /analytics/:shortId – Get analytics (clicks, device, IP) for a specific link

🌐 Redirect
GET /redirect/:shortId – Redirects to original URL and tracks visit

GET /r/:shortId – Alternate redirect endpoint

📅 Expiration & Cleanup
A daily cron job runs (0:00 UTC) to remove any short links whose expiresAt timestamp has passed.

📦 Deployment
Although this project includes backend Express code, hosting platforms like Vercel need adjustments:

Option A: Migrate Express routes into Vercel Serverless Functions

Option B: Deploy the complete backend on Render, Railway, or Fly.io, then connect to your React frontend deployed on Netlify or Vercel.

