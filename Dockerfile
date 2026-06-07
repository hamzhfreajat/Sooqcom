# Build environment
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
# Clean install to ensure exact versions are used
RUN npm ci

COPY . .
# Set environment variable to ignore ESLint errors during build on production
ENV DISABLE_ESLINT_PLUGIN=true

RUN npm run build

# Production environment
FROM nginx:alpine
# Copy built assets from build environment
COPY --from=build /app/build /usr/share/nginx/html

# Add a custom nginx configuration for React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
