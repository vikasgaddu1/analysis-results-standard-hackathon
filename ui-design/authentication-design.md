# Authentication and Authorization System Design

## Overview

The Clinical Trial Table Metadata System requires a robust authentication and authorization system to ensure secure access to sensitive clinical trial data while enabling efficient collaboration among statistical programmers, biostatisticians, and data managers.

## Authentication Strategy

### 1. JWT-Based Authentication

**Token Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "12345",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "roles": ["statistician", "editor"],
    "organization_id": "org_123",
    "exp": 1704123600,
    "iat": 1704037200,
    "jti": "unique_token_id"
  }
}
```

**Token Lifecycle:**
- **Access Token**: 1 hour expiration
- **Refresh Token**: 30 days expiration
- **Remember Me**: 90 days expiration
- **Automatic Renewal**: 15 minutes before expiration

### 2. Multi-Factor Authentication (MFA)

**Supported Methods:**
- SMS-based OTP
- Email-based OTP
- TOTP (Google Authenticator, Authy)
- Backup codes (8 single-use codes)

**Implementation:**
```
Login Flow with MFA:
Username/Password → MFA Challenge → Token Generation
```

### 3. Single Sign-On (SSO) Integration

**Supported Protocols:**
- SAML 2.0 (Enterprise)
- OAuth 2.0 / OpenID Connect
- LDAP/Active Directory

**Configuration:**
```yaml
sso:
  providers:
    - name: "corporate_saml"
      type: "saml"
      metadata_url: "https://company.com/saml/metadata"
      default_role: "viewer"
    - name: "google_oauth"
      type: "oauth2"
      client_id: "google_client_id"
      default_role: "editor"
```

## Authorization Model

### 1. Role-Based Access Control (RBAC)

**Predefined Roles:**

```python
ROLES = {
    "super_admin": {
        "description": "System administrator",
        "permissions": ["*"]  # All permissions
    },
    "org_admin": {
        "description": "Organization administrator",
        "permissions": [
            "users.manage",
            "studies.manage_all",
            "templates.manage",
            "system.view_audit"
        ]
    },
    "study_lead": {
        "description": "Study lead statistician",
        "permissions": [
            "studies.create",
            "studies.manage_owned",
            "analyses.manage",
            "outputs.manage",
            "methods.create",
            "validation.run"
        ]
    },
    "statistician": {
        "description": "Statistical programmer",
        "permissions": [
            "studies.view_assigned",
            "analyses.create",
            "analyses.edit",
            "outputs.create",
            "outputs.edit",
            "methods.view",
            "validation.run",
            "export.basic"
        ]
    },
    "biostatistician": {
        "description": "Biostatistician reviewer",
        "permissions": [
            "studies.view_assigned",
            "analyses.view",
            "analyses.review",
            "outputs.view",
            "methods.view",
            "validation.view",
            "export.basic"
        ]
    },
    "data_manager": {
        "description": "Clinical data manager",
        "permissions": [
            "studies.view_assigned",
            "analyses.view",
            "outputs.view",
            "populations.view",
            "export.basic"
        ]
    },
    "viewer": {
        "description": "Read-only access",
        "permissions": [
            "studies.view_assigned",
            "analyses.view",
            "outputs.view"
        ]
    }
}
```

### 2. Resource-Level Permissions

**Permission Format:** `resource.action[.scope]`

**Core Permissions:**
```python
PERMISSIONS = {
    # User Management
    "users.view": "View user profiles",
    "users.create": "Create new users",
    "users.edit": "Edit user profiles",
    "users.delete": "Delete users",
    "users.manage": "Full user management",
    
    # Study Management
    "studies.view_all": "View all studies",
    "studies.view_assigned": "View assigned studies only",
    "studies.view_public": "View public studies",
    "studies.create": "Create new studies",
    "studies.edit": "Edit study details",
    "studies.delete": "Delete studies",
    "studies.manage_all": "Full study management",
    "studies.manage_owned": "Manage owned studies",
    "studies.assign": "Assign users to studies",
    
    # Analysis Management
    "analyses.view": "View analyses",
    "analyses.create": "Create analyses",
    "analyses.edit": "Edit analyses",
    "analyses.delete": "Delete analyses",
    "analyses.review": "Review/approve analyses",
    "analyses.manage": "Full analysis management",
    
    # Output Management
    "outputs.view": "View outputs",
    "outputs.create": "Create outputs", 
    "outputs.edit": "Edit outputs",
    "outputs.delete": "Delete outputs",
    "outputs.manage": "Full output management",
    
    # Method Library
    "methods.view": "View methods",
    "methods.create": "Create custom methods",
    "methods.edit": "Edit methods",
    "methods.delete": "Delete methods",
    "methods.share": "Share methods organization-wide",
    
    # Template Management
    "templates.view": "View templates",
    "templates.create": "Create templates",
    "templates.edit": "Edit templates",
    "templates.delete": "Delete templates",
    "templates.manage": "Full template management",
    
    # Import/Export
    "export.basic": "Basic export (YAML/JSON)",
    "export.excel": "Excel export",
    "export.bulk": "Bulk export operations",
    "import.basic": "Basic import (YAML/JSON)",
    "import.excel": "Excel import",
    "import.bulk": "Bulk import operations",
    
    # Validation
    "validation.run": "Run validation checks",
    "validation.view": "View validation reports",
    "validation.configure": "Configure validation rules",
    
    # System Administration
    "system.view_audit": "View audit logs",
    "system.manage_config": "Manage system configuration",
    "system.manage_backup": "Manage backups"
}
```

### 3. Resource Ownership Model

**Study-Level Access Control:**
```python
class StudyAccess:
    study_id: str
    user_id: str
    role: StudyRole  # owner, collaborator, reviewer, viewer
    permissions: List[str]
    granted_by: str
    granted_at: datetime
    expires_at: Optional[datetime]

class StudyRole(Enum):
    OWNER = "owner"
    COLLABORATOR = "collaborator" 
    REVIEWER = "reviewer"
    VIEWER = "viewer"
```

**Permission Inheritance:**
```
Organization Level → Study Level → Resource Level
     (base role)   → (study access) → (specific permissions)
```

## Security Features

### 1. Session Management

**Session Security:**
```python
SESSION_CONFIG = {
    "secure": True,  # HTTPS only
    "httponly": True,  # No JavaScript access
    "samesite": "Strict",  # CSRF protection
    "max_age": 3600,  # 1 hour
    "regenerate_on_auth": True  # New session ID after login
}
```

**Session Storage:**
- Redis for session data
- Database for persistent user sessions
- Client-side for JWT tokens (httpOnly cookies)

### 2. Password Security

**Requirements:**
- Minimum 12 characters
- Mixed case letters, numbers, symbols
- No common passwords (dictionary check)
- No personal information
- Password history (last 12 passwords)

**Implementation:**
```python
PASSWORD_POLICY = {
    "min_length": 12,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_digits": True,
    "require_symbols": True,
    "check_dictionary": True,
    "check_personal_info": True,
    "history_count": 12,
    "max_age_days": 90
}
```

### 3. Account Security

**Brute Force Protection:**
```python
RATE_LIMITING = {
    "login_attempts": {
        "max_attempts": 5,
        "window_minutes": 15,
        "lockout_minutes": 30
    },
    "password_reset": {
        "max_attempts": 3,
        "window_hours": 1
    },
    "api_calls": {
        "per_minute": 100,
        "per_hour": 1000
    }
}
```

**Account Lockout:**
- Temporary lockout after failed attempts
- Progressive delays (exponential backoff)
- Admin override capability
- Automatic unlock after timeout

### 4. Data Protection

**Encryption:**
- TLS 1.3 for data in transit
- AES-256 for data at rest
- bcrypt for password hashing
- JWT signatures with HS256/RS256

**Data Anonymization:**
```python
AUDIT_LOG_FIELDS = {
    "sensitive_fields": [
        "password", "ssn", "credit_card", "api_key"
    ],
    "anonymize": True,
    "hash_user_data": True
}
```

## Implementation Architecture

### 1. Authentication Service

```python
class AuthenticationService:
    def authenticate(self, credentials: LoginCredentials) -> AuthResult
    def refresh_token(self, refresh_token: str) -> TokenPair
    def logout(self, token: str) -> bool
    def validate_token(self, token: str) -> TokenValidation
    def setup_mfa(self, user_id: str, method: MFAMethod) -> MFASetup
    def verify_mfa(self, token: str, code: str) -> bool
```

### 2. Authorization Service

```python
class AuthorizationService:
    def check_permission(self, user_id: str, permission: str, resource_id: str = None) -> bool
    def get_user_permissions(self, user_id: str) -> List[Permission]
    def assign_role(self, user_id: str, role: str, scope: str = None) -> bool
    def revoke_access(self, user_id: str, resource_id: str) -> bool
    def get_accessible_resources(self, user_id: str, resource_type: str) -> List[Resource]
```

### 3. Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User roles assignment
CREATE TABLE user_roles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    scope_type VARCHAR(50), -- 'global', 'organization', 'study'
    scope_id UUID,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(user_id, role_id, scope_type, scope_id)
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource_type VARCHAR(50),
    action VARCHAR(50)
);

-- Role permissions
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id),
    permission_id UUID REFERENCES permissions(id),
    PRIMARY KEY(role_id, permission_id)
);

-- Study access control
CREATE TABLE study_access (
    id UUID PRIMARY KEY,
    study_id UUID REFERENCES studies(id),
    user_id UUID REFERENCES users(id),
    access_level VARCHAR(20), -- 'owner', 'collaborator', 'reviewer', 'viewer'
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    UNIQUE(study_id, user_id)
);

-- MFA settings
CREATE TABLE user_mfa (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    method VARCHAR(20), -- 'sms', 'email', 'totp'
    secret_key VARCHAR(255),
    backup_codes TEXT[],
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Authentication Endpoints

```yaml
# Login
POST /api/auth/login
Request:
  username: string
  password: string
  remember_me: boolean
Response:
  access_token: string
  refresh_token: string
  expires_in: number
  user: UserProfile

# MFA verification
POST /api/auth/mfa/verify
Request:
  token: string
  code: string
Response:
  access_token: string
  refresh_token: string

# Token refresh
POST /api/auth/refresh
Request:
  refresh_token: string
Response:
  access_token: string
  expires_in: number

# Logout
POST /api/auth/logout
Headers:
  Authorization: Bearer <token>
Response:
  success: boolean
```

### Authorization Endpoints

```yaml
# Check permission
GET /api/auth/permissions/check
Query:
  permission: string
  resource_id: string (optional)
Headers:
  Authorization: Bearer <token>
Response:
  allowed: boolean
  reason: string (if denied)

# Get user permissions
GET /api/auth/permissions
Headers:
  Authorization: Bearer <token>
Response:
  permissions: string[]
  roles: Role[]
  study_access: StudyAccess[]
```

## Frontend Integration

### 1. Auth Context Provider

```typescript
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string, resourceId?: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Implementation
};
```

### 2. Route Protection

```typescript
const ProtectedRoute: React.FC<{
  children: ReactNode;
  permission?: string;
  role?: string;
  fallback?: ReactNode;
}> = ({ children, permission, role, fallback }) => {
  const { checkPermission, hasRole } = useAuth();
  
  if (permission && !checkPermission(permission)) {
    return fallback || <AccessDenied />;
  }
  
  if (role && !hasRole(role)) {
    return fallback || <AccessDenied />;
  }
  
  return <>{children}</>;
};
```

### 3. Permission-Based UI Components

```typescript
const PermissionGate: React.FC<{
  permission: string;
  children: ReactNode;
  resourceId?: string;
}> = ({ permission, children, resourceId }) => {
  const { checkPermission } = useAuth();
  
  return checkPermission(permission, resourceId) ? (
    <>{children}</>
  ) : null;
};

// Usage
<PermissionGate permission="analyses.create">
  <Button>Create Analysis</Button>
</PermissionGate>
```

## Security Monitoring

### 1. Audit Logging

**Logged Events:**
- Authentication attempts (success/failure)
- Authorization failures
- Data access (studies, analyses, outputs)
- Data modifications (create, update, delete)
- Administrative actions
- Export operations
- Configuration changes

### 2. Monitoring Alerts

**Alert Conditions:**
- Multiple failed login attempts
- Privilege escalation attempts
- Unusual access patterns
- Data export anomalies
- System configuration changes

### 3. Compliance Reporting

**Available Reports:**
- User access summary
- Permission audit trail
- Data access logs
- Authentication statistics
- Security incident reports

This authentication and authorization design provides enterprise-grade security while maintaining usability for clinical trial metadata management workflows.