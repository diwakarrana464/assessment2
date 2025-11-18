Real-Time Session-Based Auth System (MEVN Stack)

📖 Click here to read the detailed System Architecture

A full-stack application built for Assessment 2, demonstrating secure session-based authentication, role-based access control, and a real-time WebSocket dashboard using MongoDB, Express, Vue 3, and Node.js.

📦 Prerequisites

Before running this project, ensure you have the following installed:

Node.js (v14 or higher)

MongoDB (Must be installed and running locally on port 27017)

🚀 Setup Instructions

1. Clone the Repository

git clone <YOUR_REPO_URL>
cd assessment2


2. Backend Setup (Server)

The backend runs on port 5000.

Navigate to the server folder:

cd server


Install dependencies:

npm install


Configure Environment Variables:
Create a file named .env in the server/ folder and paste the following:

PORT=5000
MONGO_URI=mongodb://localhost:27017/assessment2
SESSION_SECRET=mySuperSecretAssessmentKey
CLIENT_URL=http://localhost:5173


Start the Server:

node index.js


Success Message: Server running on port 5000 and MongoDB Connected.

3. Frontend Setup (Client)

The frontend runs on port 5173 (Vite default).

Open a new terminal window.

Navigate to the client folder:

cd client


Install dependencies:

npm install


Start the Vue App:

npm run dev


Open your browser to: http://localhost:5173

🧪 How to Test

1. Default Credentials

If you have not seeded the database via Postman, you can use the registration endpoint or use these accounts (if previously created):

Role

Username

Password

Result

Admin

admin_dave

securepassword123

Redirects to Admin Dashboard (Live Monitoring)

User

user_alice

password123

Redirects to User Dashboard (Welcome Screen)

2. Testing Real-Time Features

Open Chrome and login as Admin.

Open an Incognito Window (or a different browser) and login as User.

Observe: The Admin dashboard table will instantly update to show the new user.

Test Disconnect: Close the User's tab. The entry will vanish from the Admin dashboard automatically.

3. API Testing

A Postman collection is located in postman/assessment2.collection.json. Import this into Postman to test the API endpoints independently.