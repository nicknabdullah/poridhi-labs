# Milestone 1 — Docker & Linux

This project deploys a small monitoring application with two services:

- **Dashboard** — serves the metrics page using NGINX
- **Metrics Collector** — provides system metrics through a Python Flask API

## Task 1 — Linux Setup

The Linux environment was inspected using the following commands:

| Command | Scope / Target | Status | Remarks |
|---|---|---|---|
| `uname -a` | System & Kernel | ✅ Executed | Displays system name, kernel version, and OS architecture |
| `ip addr` | Network Interfaces | ✅ Executed | Displays active network interfaces and IP address details |
| `df -h` | Disk Space Usage | ✅ Executed | Displays human-readable disk storage utilization |
| `ls -l` | File Permissions | ✅ Executed | Displays file lists with permissions, ownership, and sizes |

```bash
uname -a
ip addr
df -h
ls -l
```

## Task 2 — Docker Basics, Image Management, Networking & Storage

The following Docker resources were created, managed, and verified:

### Resource Checklist

| Resource Type | Resource Name | Status | Remarks |
|---|---|---|---|
| **Docker Image** | `collector` | ✅ Created | Custom Python Flask API container image |
| **Docker Image** | `dashboard` | ✅ Created | Custom NGINX frontend web server image |
| **Container** | `collector` | ✅ Running | Backend metrics provider container |
| **Container** | `dashboard` | ✅ Running | Frontend web UI container |
| **Docker Network** | `app-net` | ✅ Created | Custom bridge network enabling container-to-container DNS |
| **Docker Volume** | `data` | ✅ Created | Named persistent volume attached to the collector service |

### Verification Commands

| Command | Target Object | Status | Purpose |
|---|---|---|---|
| `docker images` | Local Images | ✅ Verified | Confirmed `collector` and `dashboard` images exist |
| `docker ps` | Containers | ✅ Verified | Confirmed both containers are active and running |
| `docker network ls` | Networks | ✅ Verified | Verified `app-net` network exists |
| `docker network inspect app-net` | Network Details | ✅ Verified | Confirmed both services are connected to `app-net` |
| `docker volume ls` | Volumes | ✅ Verified | Verified named volume `data` exists |
| `docker volume inspect data` | Storage Details | ✅ Verified | Inspected storage mount paths and metadata |

Both services use the `app-net` network, allowing NGINX to reach the collector by the service name `collector` instead of a hard-coded IP address.

## Task 3 — Dockerize the Application

### Service Details & Checklist

| Service Component | Base Image | Exposed / Mapped Ports | Status | Key Features / Configuration |
|---|---|---|---|---|
| **Dashboard** | `nginx:alpine` | Host `9090` → Container `80` | ✅ Dockerized | Serves `index.html`, `styles.css`, `script.js` & proxy config |
| **Metrics Collector** | `python:3.12-slim` | Container `6000` (Internal) | ✅ Dockerized | Runs Flask API (`app.py`), dependencies in `requirements.txt` |

### Dashboard Details

The dashboard uses NGINX and serves:

- `index.html`
- `styles.css`
- `script.js`

Its Dockerfile uses the `nginx:alpine` image and copies the dashboard files into `/usr/share/nginx/html`.

### Metrics Collector Details

The collector uses Python, Flask, and the following Dockerfile process:

- builds from `python:3.12-slim`
- installs dependencies from `requirements.txt`
- copies `app.py` into the image
- exposes port `6000`
- starts the Flask application

The collector API was tested directly with:

```bash
curl http://127.0.0.1:6000/status
```

## Task 4 — Docker Compose

The `compose.yaml` file manages both services.

### Configuration Overview

| Service / Feature | Component / Setting | Value / Details | Status | Remarks |
|---|---|---|---|---|
| **Dashboard Service** | Port Mapping | `9090:80` | ✅ Configured | Maps host port `9090` to NGINX container port `80` |
| **Collector Service** | Internal Exposure | `6000` | ✅ Configured | Available internally to containers; not published to host |
| **Network** | `app-net` | Bridge Network | ✅ Configured | Connects both services for internal communication |
| **Volume** | `data` | Persistent Storage | ✅ Configured | Mounted to collector; not needed for static dashboard |
| **Restart Policy** | Host Resiliency | `unless-stopped` | ✅ Configured | Restarts containers automatically on failure/reboot |

### Code Excerpts

#### Dashboard service

```yaml
ports:
  - "9090:80"
```

This maps host port `9090` to the NGINX container port `80`.

#### Collector service

```yaml
expose:
  - "6000"
```

This makes port `6000` available to other containers without publishing it directly to the host.

#### Network and volume

```yaml
networks:
  app-net:

volumes:
  data:
```

- Both services join `app-net`.
- The **collector** uses the persistent volume.
- The **dashboard** does not need a volume because it only serves static files.

#### Restart policy

Both services use:

```yaml
restart: unless-stopped
```

This restarts a service after failure or host restart unless it was intentionally stopped.

### Execution & Verification

The application was started with:

```bash
docker compose up -d --build
```

It was checked with:

```bash
docker compose ps
docker compose logs
```

The dashboard is available at:

```text
http://127.0.0.1:9090
```

## Task 5 — Monitoring & Troubleshooting

### Problem & Resolution Matrix

| Category | Problem Identified | Status | Solution / Fix |
|---|---|---|---|
| **Port Security** | Port `6000` blocked as `ERR_UNSAFE_PORT` by browsers | ✅ Resolved | Configured NGINX reverse proxy to route `/status` |
| **CORS Restriction** | Cross-Origin Request Blocked between origins | ✅ Resolved | Unified requests under same origin via NGINX proxy |
| **Container Isolation** | `localhost` in browser points to host/dashboard container | ✅ Resolved | Updated `script.js` to relative path `/status` |
| **Network Resolution** | Direct IP binding broke container portability | ✅ Resolved | Connected services on `app-net` with service name DNS |

### What caused the problem?

The dashboard initially requested the collector directly with:

```javascript
const COLLECTOR_URL = "http://localhost:6000/status";
```

This caused browser problems because port `6000` was blocked as an unsafe port. Direct requests also created a CORS issue when the dashboard and collector used different origins. Additionally, `localhost` inside the dashboard container referred to the dashboard container itself, not the collector container.

### Which command helped you find it?

The collector was tested directly with:

```bash
curl http://127.0.0.1:6000/status
```

This proved that Flask was running and returning metrics. Browser Developer Tools showed `ERR_UNSAFE_PORT` and the CORS policy error.

The complete Docker route was verified with:

```bash
curl http://127.0.0.1:9090/status
```

The successful response proved that NGINX could reach the collector over `app-net`.

The listening ports were inspected with:

```bash
sudo ss -tulnp
```

### How did you fix it?

- changed `script.js` to request the relative path `/status`
- added `nginx.conf` to proxy `/status` to `collector:6000/status`
- copied `nginx.conf` into the NGINX image
- connected both services to the `app-net` Docker network
- removed the unnecessary CORS configuration from the final collector setup
- rebuilt the dashboard image so the new configuration was included

The final request flow is:

```text
Browser -> dashboard:9090 -> NGINX -> collector:6000/status -> Flask JSON
```

## Submission

### File Structure & Deliverables

| Deliverable / Artifact | Path / Location | Status | Description |
|---|---|---|---|
| **Docker Compose File** | `compose.yaml` | ✅ Delivered | Orchestration configuration for all services |
| **Dashboard Frontend** | `dashboard/` | ✅ Delivered | Includes `Dockerfile`, `index.html`, `script.js`, `styles.css`, `nginx.conf` |
| **Collector Backend** | `collector/` | ✅ Delivered | Includes `Dockerfile`, `app.py`, `requirements.txt` |
| **Verification Screenshots**| `/screenshots` | ✅ Delivered | Includes dashboard UI, compose state, images, networks, volumes |

```text
docker-project/
├── compose.yaml
├── dashboard/
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── script.js
│   └── styles.css
└── collector/
      ├── Dockerfile
      ├── app.py
      └── requirements.txt
```

### Screenshots

Screenshots are stored in:

```text
/screenshots
```

They include the working dashboard, Compose services, Docker images, Docker network, and Docker volume.

## Short Questions

| # | Question | Answer / Explanation |
|---|---|---|
| 1 | **What is the difference between a Docker image and a container?** | An **image** is a packaged, read-only template containing application code and dependencies. A **container** is a running instance created from an image. |
| 2 | **What does `9090:80` mean?** | Maps host port `9090` to container port `80` (`host:9090 -> container:80`). |
| 3 | **Why do containers need a Docker network?** | Allows containers to communicate using service names (such as `collector`) instead of hard-coded IP addresses. |
| 4 | **Why do we use Docker volumes?** | Provides persistent storage that remains available when containers are removed and recreated. |
| 5 | **What problem does Docker Compose solve?** | Manages multiple services, builds, networks, volumes, ports, dependencies, and restart policies from one configuration file (`compose.yaml`). |

## Bonus

The services use:

```yaml
restart: unless-stopped
```

This automatically restarts a service after a failure or system reboot, but keeps it stopped when the user intentionally stops it.
