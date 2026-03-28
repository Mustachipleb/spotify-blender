# Multi-stage Dockerfile for Spotify Blender

# --- Backend Build Stage ---
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# --- Frontend Build Stage ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# We need VITE_BACKEND_URL at build time for the frontend to know where the backend is
# This can be overridden if needed, but for a standard docker setup we might want to default it
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

# --- Final Production Stage ---
FROM node:22-alpine AS runner
WORKDIR /app

# Install production dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend build artifacts
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Install production dependencies for frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --omit=dev

# Copy frontend build artifacts
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Expose ports (Backend: 4010, Frontend: 5173 - though frontend serve might use different)
# In production, we'll use react-router-serve for frontend
EXPOSE 4010 3000

# Script to run both (simplified, in real world you might use docker-compose or a process manager)
# For this task, I'll provide a simple way to start the backend. 
# Usually, you'd have two separate Dockerfiles or use this one with different entrypoints.
# I will set the default command to start the backend.

CMD ["sh", "-c", "cd backend && npm run start:prod"]
