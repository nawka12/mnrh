#!/bin/bash

domains=(moonaroh.com)
email="kayfa.haluk.y@gmail.com"
staging=0

echo "### Cleaning up old certificates..."
sudo rm -rf certbot/conf/live/moonaroh.com
sudo rm -rf certbot/conf/archive/moonaroh.com
sudo rm -rf certbot/conf/renewal/moonaroh.com.conf

echo "### Creating directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

echo "### Stopping existing containers..."
sudo docker-compose down

echo "### Building and starting app service..."
sudo docker-compose up -d --build app

echo "### Waiting for app service to start..."
sleep 10

echo "### Requesting Let's Encrypt certificate..."
sudo docker-compose run --rm certbot \
  certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email $email \
  -d moonaroh.com \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  --cert-name moonaroh.com \
  -v

# If certificate was obtained successfully, create SSL config
if [ -f "certbot/conf/live/moonaroh.com/fullchain.pem" ]; then
    echo "### Creating SSL configuration..."
    echo "ssl_certificate /etc/letsencrypt/live/moonaroh.com/fullchain.pem;" > ssl.conf
    echo "ssl_certificate_key /etc/letsencrypt/live/moonaroh.com/privkey.pem;" >> ssl.conf
    
    # Copy SSL config to nginx
    sudo docker cp ssl.conf vite-app:/etc/nginx/conf.d/
    
    echo "### Reloading nginx..."
    sudo docker-compose exec app nginx -s reload
else
    echo "### Certificate not obtained. Check the logs above for errors."
fi 