# Secure Student Voting System

A professional university voting system built specifically for **Superior University**.

## Features

- **Frontend (React)**: Modern dashboard, secure voting interface, and real-time results visualization.
- **Backend (Node.js/Express)**: Robust REST API with JWT authentication and secure password hashing.
- **Real-time Updates**: Live vote counting using Socket.io.
- **Admin Dashboard**: Comprehensive tools to manage elections, candidates, and voters.
- **Security**: Prevent duplicate voting, input validation, and protected routes.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Motion, Lucide React, Recharts.
- **Backend**: Node.js, Express, Socket.io, JWT, Bcrypt.
- **Database**: SQLite (via better-sqlite3) for reliable local persistence.

## Getting Started

1. **Wait for dependencies to install**: The environment will automatically handle this.
2. **Launch the App**: The app starts automatically on port 3000.
3. **Registration**: 
   - Go to the Register page.
   - You can choose a **Student** or **Admin** role during registration for demo purposes.
4. **Admin Setup**:
   - Log in as an Admin.
   - Go to the Admin Panel.
   - Create an Election and add Candidates.
5. **Voting**:
   - Log in as a Student.
   - On the Dashboard, find an active election and cast your vote.
   - View results update in real-time.

## Environment Variables

- `GEMINI_API_KEY`: Injected by AI Studio.
- `JWT_SECRET`: Used for token signing (defaults to a secret if not provided).

## Development

The project uses a full-stack architecture where Express serves both the API and the React frontend (via Vite middleware in development).

---
*Created for Superior University - Campus Management Solution.*
