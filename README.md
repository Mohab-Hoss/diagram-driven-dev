

# 💊 PharmaCare – Pharmacy Management Web App

PharmaCare is a modern web application designed to simplify browsing, purchasing, and managing medicines online.
The project focuses on a clean user experience, scalable architecture, and seamless integration with a backend service.

---

## 🚀 Features

* 🔐 **User Authentication**

  * Sign up / Sign in
  * Secure user sessions

* 💊 **Medicines Catalog**

  * Browse medicines with images
  * Search and filter by category
  * Stock availability display
  * Prescription-required indicator (Rx)

* 🛒 **Shopping Cart**

  * Add medicines to cart
  * Quantity management
  * Prevent adding prescription-only medicines when required

* 👤 **User Profile**

  * View account information
  * Update personal details (username, phone, address)
  * View previous orders

* 🖼 **Medicine Images**

  * Images stored and served via cloud storage
  * Dynamic image rendering with fallback icons

---

## 🧱 Tech Stack

This project is built using modern web technologies:

* **Frontend**

  * React
  * TypeScript
  * Vite
  * Tailwind CSS
  * shadcn/ui

* **Backend & Services**

  * Supabase (Database, Authentication, Storage)

---

## 📂 Project Structure (Simplified)

```
src/
 ├── components/      # Reusable UI components
 ├── pages/           # Application pages (Medicines, Profile, Auth, etc.)
 ├── lib/             # Helpers & Supabase client
 ├── types/           # TypeScript types
 └── index.css        # Global styles
```

---

## ⚙️ Getting Started (Local Development)

### Prerequisites

* Node.js (v18 or later)
* npm

### Installation

```bash
git clone <YOUR_GIT_REPOSITORY_URL>
cd <PROJECT_FOLDER>
npm install
```

### Run the App

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## 🗄 Database Overview

Main tables used in the project:

* `users` – authenticated users
* `medicines` – medicines data (price, stock, image, Rx status)
* `categories` – medicine categories
* `cart_items` – user cart data
* `orders` – order history
* `order_items` – medicines per order

---

## 📸 Image Handling

* Medicine images are stored in cloud storage.
* Each medicine record contains an `image_url`.
* The UI automatically displays the image or a placeholder icon if unavailable.

---

## 📦 Deployment

The project is production-ready and can be deployed on any modern hosting platform that supports Vite-based React applications.

Build command:

```bash
npm run build
```

---



