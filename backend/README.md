# Clinical Trial Table Metadata System - Backend

This is the backend API for the Clinical Trial Table Metadata System, built with FastAPI and PostgreSQL.

## Prerequisites

- Docker and Docker Compose
- Python 3.9+ (for local development)
- PostgreSQL (if not using Docker)

## Quick Start with Docker

1. **Clone the repository and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Copy the environment variables template:**
   ```bash
   cp .env.example .env
   ```

3. **Update the `.env` file with your configuration:**
   ```bash
   # Database configuration
   DATABASE_URL=postgresql://ars_user:ars_password@localhost:5432/ars_db
   
   # Security
   SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
   
   # First superuser (optional, for initial setup)
   FIRST_SUPERUSER_EMAIL=admin@example.com
   FIRST_SUPERUSER_PASSWORD=changeme
   
   # CORS (add your frontend URL)
   BACKEND_CORS_ORIGINS=["http://localhost:3000"]
   ```

4. **Start the PostgreSQL database and pgAdmin:**
   ```bash
   docker-compose up -d
   ```

5. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Run database migrations:**
   ```bash
   # Generate initial migration
   alembic revision --autogenerate -m "Initial migration"
   
   # Apply migrations
   alembic upgrade head
   ```

7. **Initialize the database with superuser:**
   ```bash
   python -m app.db.init_db
   ```

8. **Start the FastAPI application:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Access Points

- **API Documentation**: http://localhost:8000/docs
- **Alternative API Documentation**: http://localhost:8000/redoc
- **pgAdmin**: http://localhost:5050
  - Email: admin@example.com
  - Password: admin

## Database Management

### Using Docker Compose

The `docker-compose.yml` file sets up:
- PostgreSQL 15 database
- pgAdmin for database management

### Database Connection

To connect to PostgreSQL:
- Host: localhost
- Port: 5432
- Database: ars_db
- Username: ars_user
- Password: ars_password

### Alembic Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Downgrade one revision
alembic downgrade -1

# View migration history
alembic history
```

## Development

### Project Structure

```
backend/
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   └── env.py           # Alembic configuration
├── app/
│   ├── api/             # API endpoints
│   ├── core/            # Core functionality (config, security)
│   ├── db/              # Database configuration
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   └── main.py          # FastAPI application
├── scripts/             # Utility scripts
├── docker-compose.yml   # Docker services configuration
├── requirements.txt     # Python dependencies
└── .env.example        # Environment variables template
```

### Adding New Models

1. Create model in `app/models/`
2. Import it in `app/db/base.py`
3. Create Pydantic schemas in `app/schemas/`
4. Create API endpoints in `app/api/`
5. Generate and apply migrations

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## Production Deployment

1. Use environment-specific `.env` files
2. Set `DEBUG=False` in production
3. Use a production-grade server (e.g., Gunicorn with Uvicorn workers)
4. Set up proper database backups
5. Configure SSL/TLS
6. Set up monitoring and logging

### Example production command:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify connection string in `.env`

### Migration Issues
- Check Alembic configuration in `alembic.ini`
- Ensure all models are imported in `app/db/base.py`
- Review migration files before applying

### Import Errors
- Ensure you're in the backend directory
- Check Python path includes the backend directory
- Verify all dependencies are installed

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and ensure they pass
4. Submit a pull request

## License

See the LICENSE file in the root directory.