# DevOps Project - Image Editor

#### This is a project for DevOps course at AP Hogeschool.

The backend, frontend and database structure is is mostly created by AI as a prototype for my future project idea. I choice this project for my DevOps course at AP Hogeschool insted of using pre made project by AP beacuse while I had the chance I wanted to learn more about hosting images on a server.

## Aplication
This aplication is a image editor where you can upload/edit your image. This image is aviable to everyone when you press Genrate. You can also delete any image any time you want. This aplication made using a Node.js as backend. And using static html page with css and JS for styling and logic. As for the database im using MySQL for storing the metadata of the image and selected settings. The image are stored in the folder in the backend.

## Docker Setup

The application consists of **three main containers**:

1. **Backend**:  
   - **Image**: Node.js 18  
   - **Purpose**: Handles the application's API and image processing logic.  
   - **Volume**: Maps the `uploads` folder to persist uploaded images.

2. **Frontend**:  
   - **Image**: Nginx (latest)  
   - **Purpose**: Serves the static HTML, CSS, and JavaScript files for the web application.

3. **Database**:  
   - **Image**: MySQL  
   - **Purpose**: Stores metadata related to uploaded images and application settings.  
   - **Volume**: Maps a virtual volume to persist database data.

## Prerequisites
- Node.js
- SQL Database (as indicated by init.sql)
- npm or yarn package manager

## Project Folder Structure
``` bash
Project(base)
├── extra
│   ├── docker-compose.yml        # Docker-compose for Portainer
├── jenkins                       # Jenkins configuration
│   └── ssh
│   └── docker-compose.yml        # Docker-compose for Jenkins
├── projectmap                    # Main project directory
│   ├── frontend
│   ├── Dockerfile
│   └── server
│       ├── Dockerfile
│       ├── config                # DB Configuration files
│       ├── controllers
│       ├──models
│       ├── uploads               # Uploads directory volume for images (not virutal)   
│       └── *.env*                # Project Environment variables
└── traefik                       # Traefik configuration
    ├── config
    └── letsencrypt-certs
    └── docker-compose.yml        # Docker-compose for Traefik
└── *.env*                        # Generic Environment variables
└── docker-compose.yml            # Root docker-compose for [backend, database, frontend]
```

## Installation/Set up
Make sure that you have docker and docker-compose installed on your system.

1. Clone the repository:
```bash
git clone
cd Project
```
2. Set up aplication .env file:
```bash
cd projectmap/server
    ├── projectmap  
        └── server
touch .env
```
```bash
# Server Configuration
SERVER_URL=https://my-site-example.com
PORT=3000

# File Storage Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Database Configuration
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=image_generator

# CORS Configuration
CORS_ORIGIN=https://my-site-example.com
```
PS: makes sure that you have a domain that you can access and link to your machine. If dont have a domain and want to test your aplication before buying one then you can get a free domains then you can use https://freedns.afraid.org/ to create a custom subdomain.

3. Set up gloabal .env file:
```bash
cd ../../
    └──Project(base)
touch .env
```
Make sure the **DB configuration** is the same as in the **server .env file**. And **SERVER_URL == HOST_ADDRESS**.
```bash
# Database Configuration
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=image_generator

# Host Configuration
HOST_ADDRESS=my-site-example.com
```
4. Run the docker-compose files:
Lets start the the aplication in 3 cintainers **[backend, database, frontend]** by running:
```bash
cd Project(base)
docker-compose up --build
```
Now lest go and start up the Traefik container:
```bash
cd traefik
    └── traefik
docker-compose up --build
```
Now you should be able to access the aplication at your https://my-site-example.com