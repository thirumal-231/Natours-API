# 🏕️ Natours - Adventurous Travel Booking Platform

![Natours Banner]([https://res.cloudinary.com/dmvbudba3/image/upload/v1768134941/logo-green_auxbek.png])

## 📖 Project Overview

**Natours** is a comprehensive, full-stack travel booking platform designed to provide adventurous tours for nature lovers. The application allows users to discover tours, book their next adventure, and manage their user profile. It serves as a robust example of a modern RESTful API built with Node.js and Express.

## 🏗️ System Architecture

The application follows a **MVC (Model-View-Controller)** architecture and leverages a powerful technology stack:

- **Runtime Environment**: [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) framework.
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) for scalable, cloud-hosted NoSQL data storage.
- **Object Modeling**: [Mongoose](https://mongoosejs.com/) for elegant MongoDB object modeling.
- **Image Management**: [Cloudinary](https://cloudinary.com/) for optimizing and serving images.
- **Payments**: [Stripe](https://stripe.com/) for secure payment processing.
- **Frontend**: Server-side rendered views using [Pug](https://pugjs.org/) templates, hosted on [Render](https://render.com).

## ✨ Key Features

- **🔐 Robust Authentication**: Secure user authentication using **JSON Web Tokens (JWT)** stored in HTTP-only cookies.
  - Signup, Login, Logout using secure cookie transport.
  - Password reset functionality via email.
- **🗺️ Tour Management**:
  - **Geospatial Queries**: Find tours within a certain radius of a location.
  - Advanced filtering, sorting, pagination, and aliasing for tour APIs.
  - Top 5 cheap tours endpoint.
- **💳 Secure Booking System**:
  - Integrated **Stripe Checkout** for handling credit card payments.
  - **Stripe Webhooks** to securely fulfill bookings after successful payment events.
- **👤 User Features**:
  - Update user data (name, email) and password.
  - "My Bookings" view to see purchased tours.

## 🛡️ Security Implementations

Security is a top priority in Natours, implementing industry best practices:

- **Helmet**: Sets various HTTP headers to secure the express app.
- **Rate Limiting**: Prevents brute-force attacks and DoS by limiting requests from the same IP.
- **Data Sanitization**:
  - **NoSQL Injection**: Sanitizes user input to prevent malicious MongoDB operators.
  - **XSS (Cross-Site Scripting)**: Cleans user input to prevent HTML injection.
- **Parameter Pollution (HPP)**: Prevents pollution of HTTP parameters.
- **CORS Configuration**: customized CORS setup to allow requests from the hosted frontend (`https://natours.trustudios.in`).

## 🚀 Deployment Details

The application is deployed on **Render.com**.

- **Production URL**: [https://natours.trustudios.in](https://natours.trustudios.in)
- **API Endpoint**: `https://natours.trustudios.in/api/v1`

## 🔧 Environment Variables

To run this project, you will need to create a `config.env` file in the root directory. Use the following template:

```properties
NODE_ENV=development # or production
PORT=3003

# Database
DATABASE=mongodb+srv://<USERNAME>:<PASSWORD>@cluster0.abc.mongodb.net/natours?retryWrites=true&w=majority
DATABASE_PASSWORD=your_db_password

# JWT Authentication
JWT_SECRET=your_ultra_secure_jwt_secret_key_minimum_32_chars
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Mailtrap for Dev / SendGrid for Prod)
EMAIL_USERNAME=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_FROM=hello@natours.io

# SendGrid (Production Email)
SENDGRID_USERNAME=apikey
SENDGRID_PASSWORD=your_sendgrid_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 💻 Installation & Setup

### Local Development

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/natours.git
    cd natours
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `config.env` file using the template above and fill in your credentials.

4.  **Start the server**

    ```bash
    npm run dev
    # The server will start on port 3003 (or your defined PORT)
    ```

5.  **Access the app**
    Open your browser and navigate to `http://localhost:3003`.

### Production Setup

1.  **Build/Start**
    ```bash
    npm run start:prod
    ```
    _Ensure your production environment variables are set in your hosting provider's dashboard._

---

_Developed by Thirumala Reddy for learning Advanced Node.js, Express, and MongoDB._
