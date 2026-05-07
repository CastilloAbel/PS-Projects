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

### Environment Variables Setup

Before starting the application, you need to create an environment configuration file. 
Create a file named `.env` in the **root folder** of the project and add the following variables:

```env
# PostgreSQL Docker Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ps_password
POSTGRES_DB=pirate_ship_db

# Local path for persistent database storage (volume)
DB_DATA_PATH=./db

# Prisma Connection URL for the Backend
DATABASE_URL="postgresql://postgres:ps_password@localhost:5432/pirate_ship_db?schema=public"
```

*(Note: The Frontend will automatically connect to `http://localhost:4000` by default. If you need to change this, you can create a `.env` file inside the `Frontend` folder with `VITE_API_URL=your_custom_url`).*

### Step 1: Start the Database (PostgreSQL)

The project includes a `docker-compose.yml` file in the root to easily deploy the database using the variables you just set.

1. Open a terminal in the root of the project.
2. Run the following command to start the container in the background:
   ```bash
   docker-compose up -d
   ```

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