# Real-Time Session-Based Auth System (MEVN Stack)

This project is a full-stack application developed for **Assessment 2**. It demonstrates a secure, session-based authentication system with role-based access control and a real-time WebSocket dashboard using the **MEVN stack** (MongoDB, Express, Vue 3, Node.js).

---

## 🏗️ Architecture Explanation

### 1. Session-Based Authentication (No JWTs)
[cite_start]Per the assessment requirements[cite: 7], this system uses stateful sessions instead of stateless JWTs.
* [cite_start]**Flow:** When a user logs in, the server creates a session object stored persistently in **MongoDB** (using `connect-mongo`)[cite: 8].
* **Cookies:** A secure, HTTP-only cookie (`connect.sid`) is sent to the client. [cite_start]The frontend (Vue) automatically includes this cookie in every Axios request (`withCredentials: true`) to authenticate[cite: 37].

### 2. Real-Time Socket Mapping
[cite_start]To fulfill the requirement of tracking active users live[cite: 29], the backend maintains an **In-Memory Map**:
* **Structure:** `Map<SocketID, UserData>`
* **Logic:** When a user logs in and connects via Socket.io, their socket ID is mapped to their session username and role.
* [cite_start]**Updates:** If a user closes their tab or logs out, the `disconnect` event fires, removing them from the Map and instantly broadcasting the updated list to the Admin Dashboard[cite: 20].

### 3. Role-Based Routing
* **Frontend:** Vue Router uses global navigation guards (`beforeEach`) to check the Pinia store state.
    * [cite_start]**Admins** are redirected to `/admin-dashboard`[cite: 14].
    * [cite_start]**Users** are redirected to `/dashboard`[cite: 16].
    * Unauthenticated users are forced to `/login`.

---

## 📦 Project Structure

```text
assessment2/
├── client/            # Vue 3 + Vite Frontend
│   ├── src/stores/    # Pinia State Management
│   ├── src/router/    # Vue Router (Role Guards)
│   └── src/views/     # Dashboard Components
├── server/            # Node.js + Express Backend
│   ├── config/        # DB Connection
│   ├── models/        # Mongoose Schemas
│   ├── socket/        # Real-time Socket Handler
│   └── index.js       # Entry Point
└── postman/           # API Test Collection