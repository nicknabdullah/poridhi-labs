# Module 1 — Docker & Linux

The goal of the project is to build and deploy a small monitoring application on a Linux server using Docker. It demonstrates Linux fundamentals, Docker containerization, Docker networking, persistent storage, and Docker Compose.

## Project Overview

The application consists of two services:

* **Dashboard** — NGINX-based web dashboard.
* **Metrics Collector** — Python Flask API that provides system metrics.

## Architecture

```text
Browser
   │
   │ :9090
   ▼
Dashboard (NGINX)
   │
   │ Docker Network
   ▼
Metrics Collector
   │
   ▼
Linux System Metrics
```

## Project Structure

```text
docker-project/
├── compose.yaml
├── dashboard/
│   ├── Dockerfile
│   └── index.html
└── collector/
    ├── Dockerfile
    ├── app.py
    └── requirements.txt
```

## Services

### Dashboard

* Uses NGINX.
* Runs on container port `80`.
* Accessible from the host on port `9090`.

### Metrics Collector

* Uses Python and Flask.
* Runs on port `6000`.
* Provides a `/status` API endpoint.
* Collects basic Linux system metrics.

## Docker

The project uses:

* Docker images
* Docker containers
* Docker networking
* Docker volumes
* Docker Compose

The dashboard and collector communicate using the Docker network and container/service names.

## Running the Project

Start the application with:

```bash
docker compose up -d
```

Check the services:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs
```

Open the dashboard:

```text
http://<server-ip>:9090
```

## Testing the Metrics API

The collector provides:

```text
/status
```

It can be tested with:

```bash
curl http://localhost:6000/status
```

## Useful Docker Commands

```bash
# List Docker images
docker images

# List running containers
docker ps

# List Docker networks
docker network ls

# Inspect a network
docker network inspect <network>

# List Docker volumes
docker volume ls

# Show container resource usage
docker stats
```

## Troubleshooting

Useful commands for troubleshooting:

```bash
docker logs <container>
docker inspect <container>
docker network inspect <network>
curl <url>
ss -tulnp
```

## Learning Objectives

This project demonstrates:

* Basic Linux administration
* Docker image and container management
* Docker networking
* Docker volumes
* Containerizing applications
* NGINX configuration
* REST API basics
* Docker Compose
* Basic monitoring and troubleshooting
