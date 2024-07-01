# Stage 1: Build the React Vite TypeScript app
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM node:16-alpine

# Install a simple HTTP server to serve the built files
RUN npm install -g serve

# Copy the built files from the previous stage
COPY --from=build /app/dist /app/dist

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist"]