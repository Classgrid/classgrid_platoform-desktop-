# Classgrid Platform Architecture

## Deployment Stack
- **Frontend (`client/`)**: Hosted on **Vercel** (`opus.quantumchem.site` / `classgrid.in`). Vercel automatically builds and deploys the frontend on push to the `main` branch.
- **Backend (`server/`)**: Hosted on an **AWS EC2 instance** (`api.classgrid.in`). 

## AI Agent Instructions
**CRITICAL**: DO NOT attempt to run `npm run build` or `vite build` inside the `client/` folder on the EC2 server. The EC2 instance has limited RAM and running the frontend build will cause a memory exhaustion crash (OOM killer). The EC2 instance is exclusively used for running the PM2 Node.js backend server.
