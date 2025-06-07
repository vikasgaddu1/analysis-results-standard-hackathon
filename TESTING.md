# Testing Guide for Clinical Trial Table Metadata System

This guide provides comprehensive information about testing the Clinical Trial Table Metadata System.

## Table of Contents
- [Overview](#overview)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Continuous Integration](#continuous-integration)
- [Test Coverage](#test-coverage)

## Overview

The project uses modern testing frameworks and follows best practices for both backend and frontend testing:

- **Backend**: Python with pytest, pytest-asyncio, and pytest-cov
- **Frontend**: React with Vitest, Testing Library, and MSW
- **CI/CD**: GitHub Actions for automated testing
- **Pre-commit**: Local testing hooks before commits

## Backend Testing

### Test Structure
```
backend/app/tests/
├── conftest.py           # Shared fixtures and configuration
├── test_api/             # API endpoint tests
├── test_crud/            # CRUD operation tests
├── test_models/          # Database model tests
├── test_services/        # Service layer tests
└── test_utils/           # Utility function tests
```

### Running Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest app/tests/test_api/test_auth.py

# Run tests matching pattern
pytest -k "test_login"

# Run with verbose output
pytest -v

# Run only marked tests
pytest -m "unit"
```

### Backend Test Configuration

Configuration is defined in `backend/pytest.ini`:
- Test discovery patterns
- Coverage settings
- Test markers
- Environment variables

### Writing Backend Tests

Example test structure:
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

class TestAnalyses:
    """Test analysis endpoints."""
    
    def test_create_analysis(
        self, 
        client: TestClient, 
        auth_headers: dict,
        sample_analysis_data: dict
    ):
        """Test creating a new analysis."""
        response = client.post(
            "/api/v1/analyses", 
            json=sample_analysis_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        assert response.json()["id"] == sample_analysis_data["id"]
```

## Frontend Testing

### Test Structure
```
frontend/src/
├── __tests__/            # Test files
│   ├── components/       # Component tests
│   ├── hooks/           # Hook tests
│   └── services/        # Service tests
├── test-utils/          # Test utilities
│   ├── setup.ts         # Test setup
│   └── test-utils.tsx   # Custom render functions
└── mocks/               # MSW mock handlers
    ├── handlers.ts      # API mock handlers
    └── server.ts        # MSW server setup
```

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test AnalysisBuilder.test.tsx
```

### Frontend Test Configuration

Configuration is defined in `frontend/vitest.config.ts`:
- Test environment (jsdom)
- Setup files
- Coverage settings
- Path aliases

### Writing Frontend Tests

Example component test:
```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test-utils/test-utils';
import AnalysisBuilder from '../../components/AnalysisBuilder';

describe('AnalysisBuilder', () => {
  it('renders the analysis builder interface', () => {
    render(<AnalysisBuilder />);
    
    expect(screen.getByText(/Analysis Builder/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<AnalysisBuilder />);
    
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
});
```

## Writing Tests

### Best Practices

1. **Test Structure**
   - Use descriptive test names
   - Group related tests with `describe` blocks
   - Follow AAA pattern: Arrange, Act, Assert

2. **Test Isolation**
   - Each test should be independent
   - Use fixtures for test data
   - Clean up after tests

3. **Mocking**
   - Mock external dependencies
   - Use MSW for API mocking in frontend
   - Use pytest-mock for backend mocking

4. **Assertions**
   - Test behavior, not implementation
   - Use meaningful assertion messages
   - Test both success and error cases

### Test Data Factories

Backend example:
```python
@pytest.fixture
def sample_analysis_data() -> dict:
    """Sample analysis data for testing."""
    return {
        "id": "AN001",
        "name": "Demographics Summary",
        "description": "Summary statistics",
        "reason": "SPECIFIED",
        "purpose": "PRIMARY_OUTCOME_MEASURE"
    }
```

Frontend example:
```typescript
export const createMockAnalysis = (overrides = {}) => ({
  id: 'AN001',
  name: 'Test Analysis',
  description: 'Test description',
  ...overrides,
});
```

## Continuous Integration

### GitHub Actions Workflow

The CI pipeline runs on every push and pull request:

1. **Backend Tests**
   - Sets up PostgreSQL service
   - Installs Python dependencies
   - Runs pytest with coverage
   - Uploads coverage to Codecov

2. **Frontend Tests**
   - Installs Node.js dependencies
   - Runs linting
   - Runs Vitest with coverage
   - Uploads coverage to Codecov

3. **Integration Tests**
   - Runs both backend and frontend
   - Performs health checks
   - Runs E2E tests (when implemented)

### Pre-commit Hooks

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

Hooks run automatically before commits:
- Code formatting (Black, isort)
- Linting (flake8, ESLint)
- Type checking (mypy)
- Unit tests

## Test Coverage

### Viewing Coverage Reports

Backend:
```bash
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

Frontend:
```bash
cd frontend
npm run test:coverage
open coverage/index.html
```

### Coverage Goals

- Aim for >80% code coverage
- Focus on critical business logic
- Test edge cases and error handling
- Don't test implementation details

### Coverage Exclusions

Backend (`.coveragerc`):
- Test files
- Migrations
- Configuration files
- Abstract methods

Frontend (`vitest.config.ts`):
- Test files
- Type definitions
- Configuration files
- Main entry point

## Debugging Tests

### Backend Debugging

```bash
# Run with Python debugger
pytest --pdb

# Stop on first failure
pytest -x

# Show local variables on failure
pytest -l

# Increase verbosity
pytest -vv
```

### Frontend Debugging

```typescript
// Add debug statements
screen.debug();

// Use testing playground
screen.logTestingPlaygroundURL();

// Check specific elements
console.log(screen.getByRole('button'));
```

## Performance Testing

For performance-critical components:

```python
# Backend
@pytest.mark.slow
def test_large_dataset_processing(benchmark):
    result = benchmark(process_large_dataset, data)
    assert result.time < 1.0  # Should complete in under 1 second
```

```typescript
// Frontend
it('renders large list efficiently', async () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
  
  const start = performance.now();
  render(<LargeList items={items} />);
  const end = performance.now();
  
  expect(end - start).toBeLessThan(100); // ms
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running for backend tests
   - Check DATABASE_URL in test configuration

2. **Import Errors**
   - Verify Python path includes project root
   - Check TypeScript path aliases

3. **Async Test Failures**
   - Use `waitFor` for async operations
   - Ensure proper async/await usage

4. **Mock Not Working**
   - Check MSW handlers match request URLs
   - Verify mock server is started

### Getting Help

- Check test output for detailed error messages
- Use verbose mode for more information
- Review test logs in CI/CD
- Consult framework documentation

## Next Steps

1. Implement E2E tests with Playwright or Cypress
2. Add performance benchmarks
3. Set up mutation testing
4. Create visual regression tests
5. Add API contract testing