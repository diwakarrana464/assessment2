# Real-Time Session-Based Auth System (MEVN Stack)


A full-stack application built demonstrating **secure session-based authentication**, **role-based access control**, and a **real-time WebSocket dashboard** using **MongoDB, Express, Vue 3, and Node.js**.

---

## 📘 System Architecture  
👉 *Click here to read the detailed System Architecture*  
[Architecture Documentation](./ARCHITECTURE.md)

---

## 📦 Prerequisites

Before running the project, ensure the following are installed:

- **Node.js** (v14 or higher)
- **MongoDB** (running locally on `mongodb://localhost:27017`)

---

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/diwakarrana464/assessment2.git
cd assessment2
```
### 2. Backend Setup (Server)
The backend runs on port 5000.   
Navigate to the server folder and install dependencies:
```bash
cd server
npm install
```
### 3. Configure Environment Variables:
Create a file named `.env` in the `server/` folder and paste the following:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/assessment2
SESSION_SECRET=mySuperSecretAssessmentKey
CLIENT_URL=http://localhost:5173
```

### 4. Start the Server:
```bash
node index.js
```
Success Message: `Server running on port 5000` and `MongoDB Connected.`
### 5. Frontend Setup (Client)

The frontend runs on port 5173 (Vite default).

*Open a new terminal window.*

**Navigate to the client folder, install dependencies, Start the Vue App**
```bash
cd client
npm install
npm run dev
```
Open your browser to: http://localhost:5173

## 🧪 How to Test


### 1. Setup Postman & Create Test Accounts
The core requirement is to test the API endpoints first, which allows you to create the necessary Admin and User accounts in the database.

1.  **Import Postman Collection:**
    Open Postman, click **Import**, and select the file located at `postman_collection.json`. This populates all saved endpoints.

2.  **Create Admin Account:**
    * Find the **'Register'** endpoint in the Postman collection.
    * Send a `POST` request with the following JSON body to create your Admin:
        ```json
        {
          "username": "admin_boss",
          "password": "securepassword99",
          "role": "admin"
        }
        ```

3.  **Create Standard User Account:**
    * Use the same **'Register'** endpoint.
    * Send a `POST` request with the following JSON body:
        ```json
        {
          "username": "user_worker",
          "password": "workerpassword11",
          "role": "user"
        }
        ```

### 2. Testing Role-Based Redirection
Once the accounts are created, you can test the frontend UI. Open your browser to http://localhost:5173.

| Account | Username | Password | Expected Result |
|---|---|---|---|
| **Admin** | `admin_boss` | `securepassword99` | Redirects to `/admin-dashboard` (Live Monitoring) |
| **User** | `user_worker` | `workerpassword11` | Redirects to `/dashboard` (Welcome Screen) |

### 3. Testing Real-Time Features (Core Assessment Requirement)
This confirms the Socket.IO mapping is correctly updating the Admin view.

1.  Open **Browser Tab1** and log in as the **Admin** (`admin_boss`).
2.  Open an **Browser Tab2** browser window (or Incognito/Firefox) and log in as the **User** (`user_worker`).
3.  **Observation:** Look at the Admin's dashboard. The User will appear in the table **instantly** without refreshing the page.
4.  **Test Disconnect:** Close the User's browser tab. The entry will vanish from the Admin table automatically.

