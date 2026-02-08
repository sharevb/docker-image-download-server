# **Docker Image Download Service**

A lightweight Node.js HTTP service that lets clients **pull**, **save**, and **download** Docker images on demand.  
It supports:

- Multi‑platform pulls (`linux/amd64`, `linux/arm64`, etc.)
- Private registry authentication
- Streaming `.tar` downloads
- Running inside a container with access to the host Docker daemon

This service is ideal for CI pipelines, air‑gapped deployments, offline registries, or tooling that needs to export Docker images programmatically.

## **Features**

### ✔ Pull Docker images  
Uses `docker pull` with optional `--platform`.

### ✔ Save images as tarballs  
Uses `docker save` and streams the result directly to the client.

### ✔ Registry authentication  
Supports:
- Username/password  
- Optional registry hostname  
- Automatic logout after the request

## **Requirements**

- Docker installed on the host
- Node.js 18+ or 20+
- If running inside Docker:  
  mount the host Docker socket  
  ```
  -v /var/run/docker.sock:/var/run/docker.sock
  ```

## **Environment Variables**

| Variable | Default | Description |
|---------|---------|-------------|
| `HOST`  | `0.0.0.0` | Interface to bind the HTTP server |
| `PORT`  | `3000` | Port to listen on |
| `CORS`  | `*3000*` | CORS Allowed Origins |

## **API**

### **GET /download**

Downloads a Docker image as a `.tar` file.

#### **Query parameters**

| Name | Required | Description |
|------|----------|-------------|
| `image` | yes | Image name, e.g. `alpine:latest` |
| `platform` | no | Docker platform, e.g. `linux/arm64` |
| `registry` | no | Registry hostname for login |
| `username` | no | Registry username |
| `password` | no | Registry password |

#### **Example: public image**

```
curl -O -J "http://localhost:3000/download?image=alpine:latest"
```

#### **Example: multi‑arch image**

```
curl -O -J "http://localhost:3000/download?image=nginx:latest&platform=linux/arm64"
```

#### **Example: private registry**

```
curl -O -J \
  "http://localhost:3000/download?image=myregistry.com/app:1.2.3&platform=linux/amd64&registry=myregistry.com&username=alice&password=secret"
```

---

## **Running Locally**

Install dependencies:

```
npm install
```

Start the server:

```
HOST=127.0.0.1 PORT=3000 node server.js
```

---

## **Running in Docker**

Run it with access to the host Docker daemon:

```
docker run \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  sharevb/docker-image-download-server:latest
```

## **Security Notes**

- If using registry credentials, prefer short‑lived tokens.
- Use HTTPS or a reverse proxy if exposing the service publicly.

## **License**

MIT
- A **client CLI tool** to interact with this service

Just tell me what direction you want to take this project.
