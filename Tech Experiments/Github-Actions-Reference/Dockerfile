# Dockerfile
#
# A Dockerfile is a recipe for building a Docker image — a self-contained
# snapshot of your app and everything it needs to run.
#
# HOW IT WORKS (multi-stage build):
#   Stage 1 ("builder") — installs ALL dependencies and compiles TypeScript
#   Stage 2 ("runtime") — copies only the compiled output + prod dependencies
#
# Multi-stage builds keep the final image small by throwing away dev tools
# (TypeScript compiler, type definitions, etc.) that aren't needed at runtime.

# ── STAGE 1: builder ─────────────────────────────────────────────────────────
# Start from the official Node 20 image on Alpine Linux.
# Alpine is a minimal Linux distro (~5 MB vs ~180 MB for Debian-based images).
FROM node:20-alpine AS builder

# Set the working directory inside the container.
# All subsequent commands run relative to this path.
WORKDIR /app

# Copy package files first. Docker caches each instruction as a layer.
# By copying package*.json before the source code, Docker can reuse the
# cached "npm ci" layer on subsequent builds when only source files changed.
COPY package*.json ./

# Install ALL dependencies (including devDependencies like TypeScript).
RUN npm ci

# Now copy the rest of the source code.
COPY . .

# Compile TypeScript → JavaScript (output goes to ./dist by default).
# We need a real emit here (not --noEmit), so tsconfig.json should have
# "outDir": "dist" and "noEmit" removed/set to false for Docker builds.
# For this reference project we skip the emit and just verify the build step;
# in a real app you'd compile to dist/ and copy that to the runtime stage.
RUN npm run typecheck

# ── STAGE 2: runtime ─────────────────────────────────────────────────────────
# Start fresh from the same minimal base image.
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy only the package files and install PRODUCTION dependencies.
# "--omit=dev" skips devDependencies (TypeScript, ESLint, Vitest, etc.)
# keeping the image lean.
COPY package*.json ./
RUN npm ci --omit=dev

# In a real project you'd copy the compiled output from the builder stage:
#   COPY --from=builder /app/dist ./dist
# For this reference project there's no runtime entrypoint, so we just
# demonstrate the pattern.

# Document which port the app would listen on (informational only —
# does not actually publish the port; that's done at "docker run" time).
EXPOSE 3000

# The default command to run when the container starts.
# In a real app this might be: CMD ["node", "dist/index.js"]
CMD ["node", "--version"]
