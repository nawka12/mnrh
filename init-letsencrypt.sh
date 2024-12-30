#!/bin/bash

domains=(moonaroh.com)
email="kayfa.haluk.y@gmail.com"
staging=1

# Make sure certbot directory exists
mkdir -p certbot/conf
mkdir -p certbot/www

# Stop any existing containers
echo "### Stopping existing containers..."
sudo docker-compose down

# Start nginx
echo "### Starting nginx..."
sudo docker-compose up -d app

# Wait for nginx to start
echo "### Waiting for nginx to start..."
sleep 5

# Request the certificate
echo "### Requesting Let's Encrypt certificate..."
sudo docker-compose run --rm certbot \
  certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email $email \
  -d moonaroh.com \
  --agree-tos \
  --no-eff-email \
  --staging \
  --debug \
  --break-my-certs \
  --force-renewal

# Reload nginx
echo "### Reloading nginx configuration..."
sudo docker-compose exec app nginx -s reload 