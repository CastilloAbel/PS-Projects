# PS (Pirate Ship) 🏴‍☠️ - Project Manager

PS (Pirate Ship) is a modern, intuitive, and **Self-Hosted** Project Manager. Inspired by tools like Trello, Jira, and Linear, PS aims to offer an excellent, agile, and collaborative user experience (UX), ideal for teams that want to keep full control of their data.

## 🚀 Current Project Status (MVP)

Currently, the project is in its Minimum Viable Product (MVP) phase and has the following operational features:

* **Interactive Kanban Board:**
  * **Full Drag & Drop:** Drag and drop cards (tasks) between columns, and reorder columns (lists) horizontally.
  * **Task Management:** Create new tasks, edit their titles, add detailed descriptions, and assign team members (users) from a dedicated modal.
  * **Column Management:** Create new columns dynamically to adapt the workflow.
* **User Interface (UI/UX):**
  * Modern *Glassmorphism* design using Tailwind CSS.
  * Native support for **Dark Mode / Light Mode**.
  * **Optimistic UI:** The interface reacts instantly to your actions without waiting for the server response, providing an ultra-smooth experience.
* **Database & Backend:**
  * Connected to a real PostgreSQL database using Prisma ORM.
  * RESTful API built with Node.js and Express.

---

## 🛠️ Local Installation and Deployment Guide

Follow these steps to spin up the complete project on your local machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Docker](https://www.docker.com/) and Docker Compose (for the database)

### Step 1: Start the Database (PostgreSQL)

The project includes a `docker-compose.yml` file in the root to easily deploy the database.

1. Open a terminal in the root of the project.
2. Run the following command to start the container in the background:
   ```bash
   docker-compose up -d
   ```
*(Make sure you have your `.env` file configured in the root with the `DATABASE_URL` variable pointing to this container).*

### Step 2: Configure and Start the Backend

1. Open a new terminal and navigate to the Backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Synchronize the database schema with Prisma:
   ```bash
   npx prisma db push
   ```
   *(Optional: If it's your first time, you can populate the database with test users by running `npx ts-node prisma/seed.ts`)*
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will be running on `http://localhost:4000`.*

### Step 3: Configure and Start the Frontend

1. Open a new terminal and navigate to the Frontend folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React/Vite application:
   ```bash
   npm run dev
   ```
   *The frontend will typically be available on `http://localhost:5173`.*

---

## 👥 Test Users (Seed)
If you ran the seed script in the database, you will have access to the following mock users to test task assignment:
* **Abel** (`abel@example.com`)
* **Dummy** (`dummy@example.com`)

Happy sailing! ⚓
