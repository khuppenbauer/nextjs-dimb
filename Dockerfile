# Use an official node runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

ARG DATABASE_URL
ARG BASE_URL
ARG NEXT_PUBLIC_BASE_URL
ARG METADATA_URL

ENV DATABASE_URL=${DATABASE_URL}
ENV BASE_URL=${BASE_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV METADATA_URL=${METADATA_URL}

# Build the Next.js app
RUN npm run build

# Start the Next.js app
CMD ["npm", "start"]

# Expose port 3000
EXPOSE 3000