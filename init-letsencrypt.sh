#!/bin/bash

domains=(moonaroh.com beta.moonaroh.com)
email="kayfa.haluk.y@gmail.com"
staging=0

echo "### Creating directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

# Function to check if certificate exists and is not expired
check_cert() {
    local domain=$1
    local cert_path="certbot/conf/live/$domain/fullchain.pem"
    
    if [ -f "$cert_path" ]; then
        # Check expiration date
        local exp_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        local exp_epoch=$(date -d "$exp_date" +%s)
        local now_epoch=$(date +%s)
        local days_left=$(( ($exp_epoch - $now_epoch) / 86400 ))
        
        if [ $days_left -gt 30 ]; then
            echo "Certificate for $domain is still valid for $days_left days. Skipping renewal."
            return 0
        fi
    fi
    return 1
}

echo "### Stopping existing containers..."
sudo docker-compose down

echo "### Building and starting app service..."
sudo docker-compose up -d --build app

echo "### Waiting for app service to start..."
sleep 10

echo "### Checking and requesting Let's Encrypt certificates..."
for domain in "${domains[@]}"; do
    if check_cert "$domain"; then
        # Certificate exists and is valid - create SSL config
        echo "### Using existing certificate for $domain..."
        echo "ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;" > "ssl-$domain.conf"
        echo "ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;" >> "ssl-$domain.conf"
    else
        echo "### Requesting certificate for $domain..."
        sudo docker-compose run --rm certbot \
            certonly \
            --webroot \
            --webroot-path /var/www/certbot \
            --email $email \
            -d $domain \
            --agree-tos \
            --no-eff-email \
            --keep-until-expiring \
            --cert-name $domain \
            -v || {
                echo "### Warning: Certificate request failed for $domain"
                # Use default certificate if request fails
                echo "ssl_certificate /etc/nginx/ssl/default.pem;" > "ssl-$domain.conf"
                echo "ssl_certificate_key /etc/nginx/ssl/default.key;" >> "ssl-$domain.conf"
            }
    fi
    
    # Copy SSL config to nginx
    sudo docker cp "ssl-$domain.conf" vite-app:/etc/nginx/conf.d/
done

echo "### Reloading nginx..."
sudo docker-compose exec app nginx -s reload || {
    echo "### Warning: Failed to reload nginx. Restarting container..."
    sudo docker-compose restart app
} 