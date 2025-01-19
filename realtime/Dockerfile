# Step 1: Use the official Golang image to create a build environment
FROM golang:1.22-alpine AS build

# Step 2: Set the Current Working Directory inside the container
WORKDIR /app

# Step 3: Copy go mod and sum files
COPY ./ ./

# Step 4: Download all dependencies
RUN go mod download

# Step 5: Run tests - build will fail if tests don't pass
# RUN go test ./... -v

# Step 6: Build the Go app
RUN go build -o main .

# Step 7: Use a smaller base image to run the application
FROM alpine:latest

# Step 8: Set the Current Working Directory inside the container
WORKDIR /app

# Step 9: Copy the Pre-built binary file from the build stage
COPY --from=build /app/main .

# Step 10: Copy the words.csv file into the container
COPY words.csv .

# Step 11: Expose the port the app runs on
EXPOSE 3000

# Step 12: Command to run the executable
CMD ["./main"]
