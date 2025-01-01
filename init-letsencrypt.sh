#!/bin/bash

domains=(moonaroh.com beta.moonaroh.com)
email="kayfa.haluk.y@gmail.com"
staging=0

echo "### Cleaning up old certificates..."
sudo rm -rf certbot/conf/live/moonaroh.com
sudo rm -rf certbot/conf/archive/moonaroh.com
sudo rm -rf certbot/conf/renewal/moonaroh.com.conf
sudo rm -rf certbot/conf/live/beta.moonaroh.com
sudo rm -rf certbot/conf/archive/beta.moonaroh.com
sudo rm -rf certbot/conf/renewal/beta.moonaroh.com.conf

echo "### Creating directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

echo "### Stopping existing containers..."
sudo docker-compose down

echo "### Building and starting app service..."
sudo docker-compose up -d --build app

echo "### Waiting for app service to start..."
sleep 10

echo "### Requesting Let's Encrypt certificates..."
for domain in "${domains[@]}"; do
    sudo docker-compose run --rm certbot \
        certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        --email $email \
        -d $domain \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        --cert-name $domain \
        -v

    if [ -f "certbot/conf/live/$domain/fullchain.pem" ]; then
        echo "### Creating SSL configuration for $domain..."
        echo "ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;" > "ssl-$domain.conf"
        echo "ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;" >> "ssl-$domain.conf"
        
        # Copy SSL config to nginx
        sudo docker cp "ssl-$domain.conf" vite-app:/etc/nginx/conf.d/
    else
        echo "### Certificate not obtained for $domain. Check the logs above for errors."
    fi
done

echo "### Reloading nginx..."
sudo docker-compose exec app nginx -s reload 