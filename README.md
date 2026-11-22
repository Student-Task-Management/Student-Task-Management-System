# StudyFlow – Student Task Management System

A student productivity and task management system built with Vue 3, Node.js, Express, and MongoDB. Students can organize assignments, manage subjects, track deadlines, and monitor their study progress. Built to practice full-stack development, REST APIs, Docker, and AWS deployment.

## Features

**Dashboard (`/dashboard`)**

- View an overview of tasks and study activities
- Display total tasks, completed tasks, and pending tasks
- View upcoming deadlines
- Monitor study progress

**Task Management (`/tasks`)**

- Create, view, edit, and delete tasks
- Set task titles, descriptions, priorities, and deadlines
- Organize tasks by status: To Do, In Progress, and Completed
- Filter and search tasks

**Calendar (`/calendar`)**

- View tasks by deadline
- Track upcoming assignments
- Organize study schedules

**Subject Management (`/subjects`)**

- Create and manage subjects
- Organize tasks by subject

**Analytics (`/analytics`)**

- View task completion statistics
- Monitor productivity and progress

**Authentication**

- Register and log in
- Secure password storage
- User authentication using JWT

## Tech Stack

- Frontend: Vue 3, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express.js, TypeScript
- Database: MongoDB and Mongoose
- Authentication: JSON Web Token (JWT), bcrypt
- API: REST API
- Deployment: Docker, Docker Compose, AWS EC2, Ubuntu
- Web Server: Nginx
- Version Control: Git and GitHub

## Project Structure

| Path | Purpose |
|---|---|
| `frontend/` | Vue 3 frontend application |
| `frontend/src/components/` | Reusable UI components |
| `frontend/src/views/` | Application pages |
| `frontend/src/router/` | Frontend page navigation |
| `frontend/src/stores/` | Pinia state management |
| `frontend/src/services/` | API communication |
| `backend/` | Node.js backend application |
| `backend/src/config/` | Database and application configuration |
| `backend/src/controllers/` | Handles API requests |
| `backend/src/middleware/` | Authentication and security middleware |
| `backend/src/models/` | MongoDB database models |
| `backend/src/routes/` | API routes |
| `backend/src/services/` | Business logic |
| `backend/src/validators/` | Request validation |
| `nginx/` | Nginx reverse proxy configuration |
| `docker-compose.yml` | Defines and manages Docker services |
| `.env.example` | Example environment variables |
| `README.md` | Project documentation |

## Run Locally (without Docker)

Requirements:

- Node.js (LTS version)
- npm
- MongoDB Community Server or MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd StudyFlow
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory and configure your environment variables.

Example:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/studyflow
JWT_SECRET=your_secret_key
```

Start the backend development server:

```bash
npm run dev
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend API URL to connect to your backend.

### 4. Open the application

The default development addresses are:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API: http://localhost:5000/api

*Actual ports and routes depend on the application configuration.*

## Run with Docker

Requirements:

- Docker Desktop or Docker Engine
- Docker Compose

The Docker setup is designed to run the following services:

1. Frontend – Vue 3 application
2. Backend – Node.js and Express API
3. Database – MongoDB
4. Nginx – Reverse proxy and web server

### 1. Configure environment variables

Create your environment file using the example template:

```bash
cp .env.example .env
```

Update the environment variables with your database connection and secure JWT secret.

### 2. Build and start containers

```bash
docker compose up -d --build
```

### 3. Check container status

```bash
docker compose ps
```

### 4. View application logs

```bash
docker compose logs -f
```

### 5. Stop the containers

```bash
docker compose down
```

*Docker service names, ports, and environment variables must match the actual Docker Compose configuration.*

## Useful Docker Commands

| Command | What it does |
|---|---|
| `docker --version` | Check Docker version |
| `docker compose version` | Check Docker Compose version |
| `docker compose up -d` | Start containers in the background |
| `docker compose up -d --build` | Build images and start containers |
| `docker compose ps` | Show container status |
| `docker compose logs -f` | View live logs |
| `docker compose restart` | Restart services |
| `docker compose stop` | Stop containers |
| `docker compose down` | Stop and remove containers |
| `docker compose down -v` | Remove containers and named volumes, including database data |

## Deployment (AWS EC2)

StudyFlow is designed to be deployed using two Ubuntu EC2 instances to separate the frontend from the backend and database.

**Server 1 – Frontend**

- AWS EC2: t3.micro
- Ubuntu Server
- Docker
- Vue 3 frontend
- Nginx

**Server 2 – Backend and Database**

- AWS EC2: t3.small
- Ubuntu Server
- Docker
- Node.js and Express API
- MongoDB

### Deployment Steps

1. Launch two Ubuntu EC2 instances on AWS.
2. Configure security groups to allow the required application traffic.
3. Install Docker and Docker Compose on both servers.
4. Clone the GitHub repository onto the appropriate servers.
5. Configure production environment variables and database credentials.
6. Build and start the Docker containers.
7. Configure Nginx to route requests to the correct services.
8. Configure domain DNS records to point to the EC2 public IP addresses.
9. Configure HTTPS using an SSL certificate.
10. Test frontend, backend, API, and database connectivity.

## Domain Configuration

The planned domain structure is:

| Service | Domain |
|---|---|
| Frontend | `https://studyflow.site` |
| Backend | `https://backend.studyflow.site` |
| API | `https://api.studyflow.site` |

All domains will be configured to connect to the appropriate EC2 server and service.

## Security Notes

- Never commit `.env` files or database passwords to GitHub.
- Use strong JWT secrets.
- Restrict MongoDB access to the backend server.
- Do not expose MongoDB port `27017` publicly.
- Configure AWS Security Groups carefully.
- Use HTTPS for production.
- Keep server software and dependencies updated.

## Future Improvements

- Add user profile management.
- Add task reminders and notifications.
- Add a study timetable.
- Improve analytics and productivity reports.
- Add dark mode.
- Add mobile-friendly layouts.

## Author

**StudyFlow – Student Task Management System**

Developed as a full-stack development and cloud deployment learning project.
