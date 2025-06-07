#!/bin/bash
set -e

# This script is run by the postgres Docker container on first startup
# It creates the database and user if they don't exist

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'ars_user') THEN
            CREATE USER ars_user WITH PASSWORD 'ars_password';
        END IF;
    END
    \$\$;

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE ars_db TO ars_user;
    
    -- Create UUID extension if not exists
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Grant schema privileges
    GRANT ALL ON SCHEMA public TO ars_user;
EOSQL

echo "Database initialization completed!"