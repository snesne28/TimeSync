# 📅 TimeSync: AI Scheduler Agent

**TimeSync** is an intelligent scheduling assistant that allows users to check availability, book meetings, and manage their calendar using natural language or voice commands. It features a guest-mode architecture, ensuring that every user gets a private, isolated calendar session without requiring a Google login.

## 🚀 Overview

This project implements a full-stack AI Agent using a **React** frontend and a **FastAPI** backend. It uses **Google's Gemini 2.5 Flash** model to interpret natural language requests (e.g., "Book a meeting for lunch tomorrow") and converts them into structured database transactions.

## ✨ Features

* **Natural Language Scheduling:** Chat with an AI to book, query, and manage events.
* **Voice Assistant:** Speak directly to the agent to issue commands using the integrated microphone button (Speech-to-Text) and hear audio responses (Text-to-Speech).
* **Contextual Memory:** The agent remembers previous turns in the conversation (e.g., referencing a date mentioned earlier).
* **Global Timezone Support:** Automatically detects the user's location (e.g.,India, New York) and handles booking times in their local timezone.
* **Guest Mode (Privacy):** Uses a UUID-based system to give every device a unique, isolated calendar database. No user login required.
* **Persistent Storage:** Events and chat history are stored in a PostgreSQL database.
* **Real-time UI:** The calendar grid updates instantly after the AI confirms an action.

##  Limitations

* **Browser Compatibility (Voice):** The Voice Assistant relies on the native **Web Speech API**. It works best in **Google Chrome** or **Microsoft Edge**. Firefox and Safari may have limited support.
* **Region Latency:** The backend is hosted in Singapore (Render). Users in far-away regions might experience a slight delay in AI responses due to "Cold Starts" on the free tier.
* **Browser-Based Identity:** "Guest Mode" relies on browser local storage. If a user clears their cache, they lose access to their previous calendar events.
* **No Email Notifications:** The system currently books events in the database but does not send email invites (e.g., via SMTP).

## 🛠️ Tech Stack

**Frontend:**
* **React + Vite:** For a fast, modern UI.
* **TypeScript:** For type safety.
* **Tailwind CSS:** For styling.
* **Web Speech API:** For native, browser-based Speech-to-Text and Text-to-Speech.
* **Vercel:** Hosting provider.

**Backend:**
* **Python + FastAPI:** High-performance API framework.
* **SQLModel (SQLAlchemy):** ORM for database interactions.
* **Google Gemini API:** The "Brain" for natural language understanding.
* **Render:** Backend & Database hosting.
* **PostgreSQL:** Production database.

## ⚙️ Setup & Run Instructions

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* A Google Gemini API Key
## Architecture Overview

<img width="2816" height="1536" alt="architecture_diagram" src="https://github.com/user-attachments/assets/0b5e164d-de88-4fba-9abb-a0e81dc3caf2" />

## ⚙️ Setup & Run Instructions

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
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
