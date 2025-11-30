# 📅 TimeSync: AI Scheduler Agent

**TimeSync** is an intelligent scheduling assistant that allows users to check availability, book meetings, and manage their calendar using natural language. It features a guest-mode architecture, ensuring that every user gets a private, isolated calendar session without requiring a Google login.

## 🚀 Overview

This project implements a full-stack AI Agent using a **React** frontend and a **FastAPI** backend. It leverages **Google's Gemini 2.5 Flash** model to interpret natural language requests (e.g., *"Book a meeting for lunch tomorrow"*) and converts them into structured database transactions.

## ✨ Features

* **Natural Language Scheduling:** Chat with an AI to book, query, and manage events naturally.
* **Contextual Memory:** The agent maintains conversation history (e.g., remembering a date mentioned in a previous message).
* **Guest Mode (Privacy):** Uses a UUID-based system to give every device a unique, isolated calendar database. No user login required.
* **Persistent Storage:** Events and chat history are stored in **PostgreSQL** (Production) or **SQLite** (Local).
* **Real-time UI:** The calendar grid updates instantly after the AI confirms an action.
* **Responsive Design:** Fully responsive interface built with Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
* **Framework:** React + Vite (Fast, modern UI)
* **Language:** TypeScript (Type safety)
* **Styling:** Tailwind CSS
* **Hosting:** Vercel

### Backend
* **Framework:** Python + FastAPI (High-performance API)
* **Database ORM:** SQLModel (SQLAlchemy)
* **AI Model:** Google Gemini API (Natural language understanding)
* **Database:** PostgreSQL (Production) / SQLite (Local)
* **Hosting:** Render

## ⚙️ Setup & Run Instructions

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* A Google Gemini API Key

### 1. Backend Setup

Navigate to the backend directory, create a virtual environment, and install dependencies.

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set your API Key
export GOOGLE_API_KEY="your_key_here"
# Note: On Windows PowerShell use: $env:GOOGLE_API_KEY="your_key_here"

# Run the server
uvicorn server:app --reload
```
### 2. Frontend Setup

Navigate to the frontend directory to install dependencies and start the local development server.

```bash
cd frontend

# Install project dependencies
npm install

# Important: Ensure your API URL in src/api.ts is set to http://localhost:8000

# Run the development server
npm run dev
```
## Limitations

* **Region Latency:** The backend is hosted in Singapore (Render). Users in far-away regions might experience a slight delay in AI responses.

* **Browser-Based Identity:** "Guest Mode" relies on browser local storage. If a user clears their cache, they lose access to their previous calendar events.

* **No Email Notifications:** The system currently books events in the database but does not send email invites (e.g., via SMTP).

## Roadmap & Improvements

* **User Authentication:** Replace the Guest ID system with real OAuth (Google/GitHub Login) to allow users to access their calendar across multiple devices.
* **External Sync:** Integrate the Google Calendar API (Service Account) to sync these database events with a real Google Calendar.
* **Conflict Resolution:** Improve the AI's logic to suggest alternative times when a slot is double-booked.
* **Voice Interface:** Add speech-to-text to allow users to speak their scheduling requests.

  ## OUTPUT

  <img width="1915" height="866" alt="image" src="https://github.com/user-attachments/assets/209c86ad-3bd6-41a5-8292-e1fe1fe89c1b" />
