# DevOps Project - Image Editor

## Description
This project is part of the DevOps course at AP Hogeschool. My aplication is a application that has a image editor with a HTML/CSS/JS front-end and Node.js backend, including SQL database for the metadata/edit-data of the image.

## Prerequisites
- Node.js
- SQL Database (as indicated by init.sql)
- npm or yarn package manager

## Project Structure
```
Project/
├── FrontendImageUploading
│   ├── HTML
│   ├── CSS
│   └── JS
├── server
│   ├── Node.js
│   ├── config
│   ├── uploads (Images)
├── sql
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone
cd Project
```
2. Install backend dependencies:
```bash
cd server
npm install
```
3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Set up the database:
- Run the initialization script:
```bash
cd ../server
node config/initDatabase.js
```
5. Set up the .env file (example):
```bash
# .server
SERVER_URL=http://localhost:3000
UPLOAD_DIR=uploads # server/uploads

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=image_editor
PORT=3000
```
## Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend:
```bash
cd client
npm start
```

Now you should be able to access the application at http://localhost:3000