# Step 1: Use the official Golang image to create a build environment
FROM golang:1.19-alpine AS build

# Step 2: Set the Current Working Directory inside the container
WORKDIR /app

# Step 3: Copy go mod and sum files
COPY ./ ./

# Step 4: Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Step 6: Build the Go app
RUN go build -o main ./cmd/...

# Step 7: Use a smaller base image to run the application
FROM alpine:latest

# Step 8: Set the Current Working Directory inside the container
WORKDIR /app

# Step 9: Copy the Pre-built binary file from the build stage
COPY --from=build /app/main .

# Step 10: Expose the port the app runs on
EXPOSE 3000

# Step 11: Command to run the executable
CMD ["./main"]
