# System Architecture Documentation

This document provides a technical overview of the "Real-Time Session-Based Auth System" built for Assessment 2. The system is a full-stack web application designed to demonstrate secure stateful authentication and real-time bi-directional communication.


### The application follows a decoupled Client-Server architecture:

## 1. 💻 Technology Stack

* **MongoDB:** NoSQL database for persistent storage and session management.
* **Express.js:** Minimalist, flexible backend web application framework for routing and API creation.
* **Vue.js (v3):** Progressive frontend framework used for the reactive Admin and User Dashboards.
* **Node.js:** JavaScript runtime environment used to execute the backend server and Socket.IO logic.
* **Socket.IO:** Library enabling real-time, bidirectional, event-based communication between the server and client.


## 2. 🔐 Authentication Strategy: Session-Based

Unlike modern stateless approaches (JWT), this project implements **Stateful Session Authentication** as strictly required by the assessment.

### Why Sessions?

* **Server Control:** The server can instantly revoke a session (e.g., banning a user or forcing logout), whereas JWTs are valid until their expiration time.
* **Security:** Session IDs are stored in **HttpOnly, Secure Cookies**, preventing Cross-Site Scripting (XSS) attacks from accessing the session identifier (unlike tokens stored in LocalStorage).
* **Persistence:** Sessions are stored in **MongoDB** using `connect-mongo`, ensuring persistence across server restarts.

### The Authentication Flow

1.  **Client (Login):** Sends `POST /login` with `username`/`password`.
2.  **Server (Validation):**
    * Validates credentials (via `bcrypt` hash comparison).
    * Generates a unique **Session ID**.
    * Stores the session data (User ID, Role) in the sessions collection in MongoDB via `connect-mongo`.
3.  **Response:** The server sends the Session ID back in a cookie header (`Set-Cookie: connect.sid=...`).
4.  **Subsequent Requests:**
    * The browser automatically attaches the `connect.sid` cookie to every request.
    * Express middleware (`express-session`) looks up the Session ID in MongoDB to restore the authenticated user data to `req.session.user`.

## 3. ⚡ Real-Time Communication (Socket.IO)

To meet the requirement of a "Real-Time Admin Dashboard," the system establishes a **WebSocket connection** using **Socket.IO** alongside the Express HTTP REST API.

### Challenge: Mapping HTTP Sessions to WebSockets

Socket.IO connections are separate from standard Express HTTP requests. The key architectural challenge is **bridging the authenticated HTTP session to the persistent Socket.IO connection**.

To achieve this securely and statefully, we implemented an in-memory mapping strategy coupled with session middleware in the Socket.IO handshake.

### Implementation Details (Server-Side Logic)

#### **1. Session-to-Socket Bridge (Middleware)**
A custom Socket.IO middleware intercepts the initial handshake, parses the user's `connect.sid` cookie, and uses `connect-mongo` to deserialize the session data, attaching the authenticated user object directly to `socket.request.session`. This ensures the user is identified before a connection is established.

#### **2. Real-Time User Tracking (In-Memory Map)**
The server maintains an in-memory JavaScript `Map` to track the live status of currently connected sockets.

**Map Structure:** `activeUsers`
```javascript
// Key: SocketID (String) -> Value: User Object
activeUsers.set(socket.id, { 
    username, 
    role, 
    sessionId: socket.request.session.id, // Linked to the Mongo session
    connectedAt: new Date() 
});
```

#### 3. Broadcasting Events

The system uses the `connection` and `disconnect` events to manage the `activeUsers` Map and notify the Admin Dashboard:

* **On Connect:** The server adds the new user to the `activeUsers` Map and immediately emits the full list of connected users to all Admin clients listening on the `update-user-list` event.
* **On Disconnect:** When the socket connection breaks (tab closed or explicit logout), the server finds the user by `socket.id`, removes them from the `activeUsers` Map, and re-broadcasts the updated list immediately via the `update-user-list` event.

## 4. 🖼️ Frontend Architecture (Vue 3)

The frontend is implemented as a **Single Page Application (SPA)** using Vue 3 and built with Vite for a fast development experience.

### State Management (Pinia)
* **Store:** `authStore`
* **Responsibility:** Acts as the single source of truth for the UI, holding the core user object and the `isAuthenticated` boolean flag derived from the successful session check.

### Routing (Vue Router)
The application implements **Role-Based Access Control (RBAC)** on the client side via Vue Router's **Navigation Guards** (`router.beforeEach`).

#### Guard Logic:
1.  **Authentication Check:** Checks if the requested route requires authentication. If the user is not logged in (`isAuthenticated = false`), they are redirected to `/login`.
2.  **Role Check:** If the route requires a specific role (e.g., `meta: { roles: ['admin'] }`), the guard ensures a role mismatch results in redirection to the appropriate default dashboard (`/user-dashboard` or `/admin-dashboard`).

### Socket Lifecycle Management
Component lifecycle hooks are strictly managed to ensure accurate real-time tracking on the server:

* **`onMounted`:** Components requiring real-time updates (both dashboards) connect to the Socket.IO server and identify themselves.
* **`onUnmounted`:** Components explicitly disconnect from the socket server. This prevents **"ghost" connections** and ensures the Admin dashboard accurately reflects the true number of active users browsing the application.


## 5. Database Schema (MongoDB)

The database consists of two primary collections.

### A. `users` Collection
Stores persistent user account information, defined by the Mongoose Schema.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique document identifier |
| `username` | String | Unique login name |
| `password` | String | **Hashed (bcrypt)** string. Plaintext is never stored. |
| `role` | String | Enum: `['admin', 'user']`. Determines access level. |
| `createdAt` | Date | Timestamp of creation |

### B. `sessions` Collection
Managed automatically by the `connect-mongo` middleware.

* **Purpose:** Persistence. This ensures that if the Node.js server restarts, currently logged-in users remain authenticated because the session data is stored in the database, not volatile memory.
* **TTL (Time To Live):** Sessions automatically expire and are deleted from the database after 14 days (default configuration).