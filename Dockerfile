FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with specific flags
RUN npm install

# Copy rest of the files
COPY . .

# Build with specific memory allocation
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
