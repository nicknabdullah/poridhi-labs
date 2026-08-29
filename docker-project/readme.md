# Milestone 1 — Docker & linux

This project deploys a small monitoring application with two services:

- **Dashboard** — serves the metrics page using NGINX
- **Collector** — provides system metrics through a Python Flask API

## Task 1 — Linux setup

The Linux environment was inspected using the following commands:

| Command | Status | Remarks |
|---|---|---|
| `uname -a` | ✅ Executed | Displays system name, kernel version, and OS architecture |
| `ip addr` | ✅ Executed | Displays active network interfaces and IP address details |
| `df -h` | ✅ Executed | Displays human-readable disk storage utilization |
| `ls -l` | ✅ Executed | Displays file lists with permissions, ownership, and sizes |

```bash
uname -a
ip addr
df -h
ls -l
```

## Task 2 — Docker basics, image management, networking & storage

The following Docker resources were created, managed, and verified:

### Resource checklist

| Resource name | Status | Remarks |
|---|---|---|
| `collector` image | ✅ Created | Custom Python Flask API container image |
| `dashboard` image | ✅ Created | Custom NGINX frontend web server image |
| `collector` container | ✅ Running | Backend metrics provider container |
| `dashboard` container | ✅ Running | Frontend web UI container |
| `app-net` network | ✅ Created | Custom bridge network enabling container-to-container DNS |
| `data` volume | ✅ Created | Named persistent volume attached to the collector service |

### Verification commands

| Command | Status | Purpose |
|---|---|---|
| `docker images` | ✅ Verified | Confirmed `collector` and `dashboard` images exist |
| `docker ps` | ✅ Verified | Confirmed both containers are active and running |
| `docker network ls` | ✅ Verified | Verified `app-net` network exists |
| `docker network inspect app-net` | ✅ Verified | Confirmed both services are connected to `app-net` |
| `docker volume ls` | ✅ Verified | Verified named volume `data` exists |
| `docker volume inspect data` | ✅ Verified | Inspected storage mount paths and metadata |

Both services use the `app-net` network, allowing NGINX to reach the collector by the service name `collector` instead of a hard-coded IP address.

## Task 3 — Dockerize the application

### Service details & checklist

| Service component | Base image | Exposed / mapped ports | Status | Key features / configuration |
|---|---|---|---|---|
| **Dashboard** | `nginx:alpine` | Host `9090` → Container `80` | ✅ Dockerized | Serves `index.html` & proxy config |
| **Collector** | `python:3.12-slim` | Container `6000` (Internal) | ✅ Dockerized | Runs Flask API (`app.py`), dependencies in `requirements.txt` |

### Dashboard details

The dashboard uses NGINX and serves:

- `index.html` (combining HTML structure, inline CSS styles, and JavaScript logic)

Its Dockerfile uses the `nginx:alpine` image and copies the dashboard files into `/usr/share/nginx/html`.

### Collector details

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

## Task 4 — Docker compose

The `compose.yaml` file manages both services.

### Configuration overview

| Service / feature | Value | Status | Remarks |
|---|---|---|---|
| **Dashboard service** | `9090:80` | ✅ Configured | Maps host port `9090` to NGINX container port `80` |
| **Collector service** | `6000` | ✅ Configured | Available internally to containers; not published to host |
| **Network** | `app-net` | ✅ Configured | Connects both services for internal communication |
| **Volume** | `data` | ✅ Configured | Mounted to collector; not needed for static dashboard |
| **Restart policy** | `unless-stopped` | ✅ Configured | Restarts containers automatically on failure/reboot |

### Code excerpts

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

### Execution & verification

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

## Task 5 — Monitoring & troubleshooting

### Problem & resolution

|  | Problem identified | Status | Solution / fix |
|---|---|---|---|
| 1 | Port `6000` blocked as `ERR_UNSAFE_PORT` by browsers | ✅ Resolved | Configured NGINX reverse proxy to route `/status` |
| 2 | Cross-Origin Request Blocked between origins | ✅ Resolved | Unified requests under same origin via NGINX proxy |
| 3 | `localhost` in browser points to host/dashboard container | ✅ Resolved | Updated `script.js` to relative path `/status` |
| 4 | Direct IP binding broke container portability | ✅ Resolved | Connected services on `app-net` with service name DNS |

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

### File structure & deliverables

| Deliverable | Path | Status | Description |
|---|---|---|---|
| **Docker compose file** | `compose.yaml` | ✅ Delivered | Orchestration configuration for all services |
| **Dashboard frontend** | `dashboard/` | ✅ Delivered | Includes `Dockerfile`, `index.html`, `nginx.conf` |
| **Collector backend** | `collector/` | ✅ Delivered | Includes `Dockerfile`, `app.py`, `requirements.txt` |
| **Verification screenshots**| `/screenshots` | ✅ Delivered | Includes dashboard UI, compose state, images, networks, volumes |

```text
docker-project/
├── compose.yaml
├── dashboard/
│   ├── Dockerfile
│   ├── index.html
│   └── nginx.conf
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

## Short questions

|  | Question | Answer |
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
