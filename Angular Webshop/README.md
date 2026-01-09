# 🛒 Angular WebShop

A modern **Angular-based e-commerce demo application** built to explore core Angular concepts such as components, services, routing, state management, and integration with a lightweight backend.  

This project was created by following and extending a YouTube tutorial, with the goal of **learning Angular through a real-world style application**.

📺 Tutorial reference: <https://youtu.be/-QV07KcnJEk>

---

## ✨ Features

- Product listing with reusable components
- Shopping cart functionality
- Client-side state management using Angular services
- Modular and scalable project structure
- Tailwind CSS for styling
- Node.js backend for checkout flow (demo)
- Environment-based configuration
- Clean separation of pages, components, models, and services

---

## 🧱 Tech Stack

### Frontend

- **Angular** (v13.2.0)
- **TypeScript**
- **Tailwind CSS**
- Angular Router
- Karma & Jasmine (testing)

### Backend (Demo)

- **Node.js**
- Express-style server
- Static success & cancel pages for checkout simulation

---

## 📁 Project Structure

```

├── server/                # Node.js backend (demo checkout server)
│   ├── server.js
│   └── public/
│       ├── success.html
│       └── cancel.html
│
├── src/
│   ├── app/
│   │   ├── components/    # Shared UI components (header, etc.)
│   │   ├── pages/         # Page-level components (home, cart)
│   │   ├── services/      # Business logic & state management
│   │   ├── models/        # TypeScript models
│   │   └── app.module.ts
│   │
│   ├── assets/
│   └── environments/
│
└── angular.json

````

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- Angular CLI

```bash
npm install -g @angular/cli
````

---

### 🔧 Install Dependencies

```bash
npm install
```

---

### ▶️ Run Development Server

```bash
ng serve
```

Then open:
👉 [http://localhost:4200/](http://localhost:4200/)

The app will automatically reload when you change source files.

---

### 🧪 Running Tests

```bash
ng test
```

Runs unit tests using **Karma**.

---

### 🏗 Build for Production

```bash
ng build
```

Build artifacts will be stored in the `dist/` directory.

---

## 🖥 Backend (Optional)

To run the demo Node.js server:

```bash
cd server
npm install
node server.js
```

This is used to simulate checkout success and cancellation pages.

---

## 🎯 Learning Goals

This project was built to:

- Understand Angular component architecture
- Practice service-based state management
- Learn routing and modular design
- Explore frontend–backend integration
- Apply modern styling with Tailwind CSS

---

## 📌 Notes

- This is a **learning and showcase project**, not a production-ready webshop.
- No real payments or authentication are implemented.
- Product data is static / mock-based.

---

## 📄 License

This project is open-source and available for learning and personal use.

---

## 🙌 Acknowledgements

- Angular Team
- YouTube tutorial creator
- Open-source community
