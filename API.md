# 📡 Tractocamión 4.0 - API Documentation

## Base URL

```
http://localhost:3000/api
```

---

## Endpoints

### Authentication

All authentication endpoints are public except for logout, profile, and password change which require a valid JWT token.

#### Register New User

Register a new user account (public registration is limited to 'operador' role).

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "operator_id": 1  // Optional: Link to existing operator
}
```

**Response:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 7,
    "username": "newuser",
    "email": "user@example.com",
    "role": "operador",
    "operator_id": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

#### Login

Authenticate with username/email and password.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "login": "admin",  // Username or email
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@tractocamion.com",
    "role": "admin",
    "operator_id": null,
    "operator": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `423 Locked`: Account locked due to failed login attempts

---

#### Refresh Token

Get a new access token using a refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Token renovado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

#### Logout

Invalidate the current access token (requires authentication).

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logout exitoso"
}
```

---

#### Get Current User Profile

Get the profile of the currently authenticated user (requires authentication).

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@tractocamion.com",
  "role": "admin",
  "operator_id": null,
  "is_active": true,
  "last_login": "2026-01-31T08:40:42.711Z",
  "createdAt": "2026-01-31T08:39:07.052Z",
  "operator": null
}
```

---

#### Change Password

Change the password for the current user (requires authentication).

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

### Data Endpoints

### Health Check

Check if the server is running and get platform information.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T09:53:59.950Z",
  "platform": "linux",
  "node_version": "v18.0.0"
}
```

---

### Get Processes

Get the status of all running processes.

**Endpoint:** `GET /api/processes`

**Response:**
```json
{
  "processes": [
    {
      "name": "Web Server",
      "status": "running",
      "uptime": "5h 23m",
      "cpu": "2.3%",
      "memory": "45MB"
    }
  ],
  "timestamp": "2026-01-29T09:53:59.950Z"
}
```

---

### Get Trucks

Get the status of all trucks in the system.

**Endpoint:** `GET /api/trucks`

**Response:**
```json
{
  "trucks": [
    {
      "id": "TRK-001",
      "plate": "ABC-123",
      "status": "active",
      "location": "Patio A",
      "operator": "Juan Pérez",
      "cycle_time": "45min"
    }
  ],
  "total": 4,
  "active": 3
}
```

---

### Get Operators

Get the status of all operators.

**Endpoint:** `GET /api/operators`

**Response:**
```json
{
  "operators": [
    {
      "id": "OP-001",
      "name": "Juan Pérez",
      "status": "working",
      "hours": "3.5h",
      "cycles": 4,
      "earnings": "$280"
    }
  ],
  "total": 5,
  "available": 2
}
```

---

### Create Cycle

Record a new work cycle.

**Endpoint:** `POST /api/cycles`

**Request Body:**
```json
{
  "truck_id": "TRK-001",
  "operator_id": "OP-001",
  "start_time": "2026-01-29T10:00:00Z",
  "end_time": "2026-01-29T10:55:00Z",
  "location": "Patio A"
}
```

**Response:**
```json
{
  "success": true,
  "cycle": {
    "id": "CYC-ABC123",
    "truck_id": "TRK-001",
    "operator_id": "OP-001",
    "start_time": "2026-01-29T10:00:00Z",
    "end_time": "2026-01-29T10:55:00Z",
    "location": "Patio A",
    "timestamp": "2026-01-29T10:55:30.123Z"
  }
}
```

---

## Status Codes

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Usage Examples

### JavaScript (Fetch)

```javascript
// Get health status
const response = await fetch('http://localhost:3000/api/health');
const data = await response.json();
console.log(data);

// Create a cycle
const cycle = {
  truck_id: 'TRK-001',
  operator_id: 'OP-001',
  start_time: new Date().toISOString(),
  end_time: new Date().toISOString(),
  location: 'Patio A'
};

const response = await fetch('http://localhost:3000/api/cycles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(cycle)
});
```

### cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Get trucks
curl http://localhost:3000/api/trucks

# Create cycle
curl -X POST http://localhost:3000/api/cycles \
  -H "Content-Type: application/json" \
  -d '{
    "truck_id": "TRK-001",
    "operator_id": "OP-001",
    "start_time": "2026-01-29T10:00:00Z",
    "end_time": "2026-01-29T10:55:00Z",
    "location": "Patio A"
  }'
```

### Python

```python
import requests

# Get health status
response = requests.get('http://localhost:3000/api/health')
data = response.json()
print(data)

# Create cycle
cycle = {
    'truck_id': 'TRK-001',
    'operator_id': 'OP-001',
    'start_time': '2026-01-29T10:00:00Z',
    'end_time': '2026-01-29T10:55:00Z',
    'location': 'Patio A'
}

response = requests.post(
    'http://localhost:3000/api/cycles',
    json=cycle
)
print(response.json())
```

---

## Integration

The API is designed to integrate with:

- Mobile applications
- Desktop applications
- IoT devices
- Third-party logistics systems
- Analytics platforms
- Payment gateways

---

## CORS

CORS is enabled for all origins. For production, configure specific origins in the server settings.

---

## Rate Limiting

Currently, no rate limiting is implemented. For production deployment, consider adding rate limiting middleware.

---

## Authentication

This version does not include authentication. For production use, implement JWT or OAuth2 authentication.

---

**API Version:** 4.0.0

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "role": "operador",
  "operator_id": 1
}
```

**Validation:**
- `username`: 3-50 characters, alphanumeric with hyphens/underscores
- `email`: Valid email format
- `password`: Minimum 8 characters, must include uppercase, lowercase, and number
- `role`: One of: `admin`, `gerente`, `operador`
- `operator_id`: Optional, required only for `operador` role

**Response (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 7,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "operador",
    "operator_id": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

### Login

Authenticate a user and get access token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "login": "admin",
  "password": "Admin123!"
}
```

**Note:** `login` field accepts either username or email.

**Response (200):**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@tractocamion.com",
    "role": "admin",
    "operator_id": null,
    "operator": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses:**
- `401`: Invalid credentials
- `423`: Account locked due to failed login attempts

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Token renovado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

### Logout

Invalidate current access token.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logout exitoso"
}
```

---

### Get Current User Profile

Get authenticated user's profile information.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@tractocamion.com",
  "role": "admin",
  "operator_id": null,
  "is_active": true,
  "last_login": "2026-01-30T13:21:54.773Z",
  "createdAt": "2026-01-30T13:21:23.901Z",
  "operator": null
}
```

---

### Change Password

Change current user's password.

**Endpoint:** `PUT /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

## Protected Endpoints

All endpoints below require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Get Trucks

**Endpoint:** `GET /api/trucks`

**Authorization:**
- `admin`, `gerente`: See all trucks
- `operador`: See only assigned truck

**Response:**
```json
{
  "trucks": [...],
  "total": 4,
  "active": 3
}
```

---

### Get Operators

**Endpoint:** `GET /api/operators`

**Authorization:**
- `admin`, `gerente`: See all operators
- `operador`: See only self

**Response:**
```json
{
  "operators": [...],
  "total": 5,
  "available": 2
}
```

---

### Get Processes

**Endpoint:** `GET /api/processes`

**Authorization:** `admin`, `gerente` only

**Response:**
```json
{
  "processes": [...],
  "timestamp": "2026-01-30T13:21:44.599Z"
}
```

---

### Create Cycle

**Endpoint:** `POST /api/cycles`

**Authorization:** All authenticated users
- `operador`: Can only create cycles for themselves

**Request Body:**
```json
{
  "truck_id": "TRK-001",
  "operator_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "cycle": {
    "id": "CYC-...",
    "truck_id": "TRK-001",
    "operator_id": 1,
    "timestamp": "2026-01-30T13:21:44.599Z",
    "created_by": "admin"
  }
}
```

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access, user management |
| `gerente` | Manager access, see all data but limited admin functions |
| `operador` | Operator access, see only own data |

### Permission Matrix

| Action | Admin | Gerente | Operador |
|--------|-------|---------|----------|
| View dashboard | ✅ | ✅ | ✅ |
| View all trucks | ✅ | ✅ | ❌ (only own) |
| View all operators | ✅ | ✅ | ❌ (only self) |
| View processes | ✅ | ✅ | ❌ |
| Create cycles | ✅ | ✅ | ✅ (only own) |
| Manage users | ✅ | ❌ | ❌ |

---

## Security Features

### Rate Limiting

- **Login endpoint**: 5 attempts per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **Strict operations**: 10 attempts per 15 minutes

### Account Locking

- After 5 failed login attempts, account is locked for 15 minutes
- Lock duration is configurable via `LOCK_TIME_MINUTES` env variable

### Token Expiration

- **Access Token**: 1 hour (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)

### Password Requirements

- Minimum 8 characters
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Hashed with bcrypt (12 rounds)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Errores de validación",
  "errors": [
    {
      "field": "password",
      "message": "La contraseña debe tener al menos 8 caracteres"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Token no proporcionado"
}
```

### 403 Forbidden
```json
{
  "error": "No tienes permisos para esta acción",
  "requiredRoles": ["admin", "gerente"],
  "yourRole": "operador"
}
```

### 423 Locked
```json
{
  "error": "Cuenta bloqueada temporalmente. Intenta en 12 minutos",
  "lockedUntil": "2026-01-30T13:45:00.000Z"
}
```

### 429 Too Many Requests
```json
{
  "error": "Demasiados intentos de login desde esta IP",
  "message": "Por favor intenta nuevamente en 15 minutos",
  "retryAfter": 15
}
```

---

## Default Users

The system comes with default users for testing:

| Username | Password | Role |
|----------|----------|------|
| admin | Admin123! | admin |
| gerente1 | Gerente123! | gerente |
| operador1 | Operador123! | operador |

**⚠️ IMPORTANT:** Change these passwords in production!

---

## 🔥 NEW INTEGRATIONS - More Consciousness & Absoluteness

The following endpoints have been added to make the system more **conscious** (intelligent/aware) and **absolute** (complete/thorough).

---

### Cycle Management (Enhanced)

#### Get All Cycles

Get all cycles with optional filters.

**Endpoint:** `GET /api/cycles`

**Query Parameters:**
- `status` (optional): Filter by status (`in_progress`, `completed`, `cancelled`)
- `truck_id` (optional): Filter by truck ID
- `operator_id` (optional): Filter by operator ID
- `limit` (optional): Limit results (default: 50)

**Response:**
```json
{
  "success": true,
  "cycles": [
    {
      "id": "CYC-L8K9J7-A1B2C3D4",
      "truck": {
        "id": "TRK-001",
        "plate": "ABC-123",
        "location": "Puerto - Muelle 3"
      },
      "operator": {
        "id": 1,
        "code": "OP-001",
        "name": "Juan Pérez"
      },
      "start_time": "2026-01-31T10:00:00.000Z",
      "end_time": "2026-01-31T10:45:00.000Z",
      "duration_minutes": 45,
      "earnings": 57.50,
      "status": "completed",
      "start_location": "Puerto - Muelle 3",
      "end_location": "Patio - Zona A"
    }
  ],
  "total": 1
}
```

---

#### Get Single Cycle

Get detailed information about a specific cycle.

**Endpoint:** `GET /api/cycles/:id`

**Response:**
```json
{
  "success": true,
  "cycle": {
    "id": "CYC-L8K9J7-A1B2C3D4",
    "truck": { /* full truck object */ },
    "operator": { /* full operator object */ },
    "start_time": "2026-01-31T10:00:00.000Z",
    "end_time": "2026-01-31T10:45:00.000Z",
    "duration_minutes": 45,
    "earnings": 57.50,
    "status": "completed",
    "start_location": "Puerto - Muelle 3",
    "end_location": "Patio - Zona A"
  }
}
```

---

#### Complete Cycle

Mark a cycle as completed and calculate earnings.

**Endpoint:** `POST /api/cycles/:id/complete`

**Request Body:**
```json
{
  "end_location": "Patio - Zona A"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cycle completed successfully",
  "cycle": {
    "id": "CYC-L8K9J7-A1B2C3D4",
    "truck_id": "TRK-001",
    "operator_id": 1,
    "start_time": "2026-01-31T10:00:00.000Z",
    "end_time": "2026-01-31T10:45:00.000Z",
    "duration_minutes": 45,
    "earnings": 57.50,
    "status": "completed"
  },
  "stats": {
    "operator_total_cycles": 156,
    "operator_total_earnings": 8934.50,
    "truck_total_cycles": 203
  }
}
```

**Earnings Calculation:**
- Base rate: $50/hour
- Efficiency bonus: +$20 for cycles under 60 minutes
- Example: 45 min = (45/60) * $50 + $20 = $57.50

---

#### Update Cycle Location

Update the current location of an in-progress cycle (real-time tracking).

**Endpoint:** `PATCH /api/cycles/:id/location`

**Request Body:**
```json
{
  "location": "En ruta - KM 5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "cycle": {
    "id": "CYC-L8K9J7-A1B2C3D4",
    "truck_id": "TRK-001",
    "location": "En ruta - KM 5",
    "updated_at": "2026-01-31T10:15:00.000Z"
  }
}
```

---

### Analytics & Intelligence (Consciousness)

#### Dashboard Analytics

Get comprehensive dashboard analytics with KPIs and performance metrics.

**Endpoint:** `GET /api/analytics/dashboard`

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-31T15:30:00.000Z",
  "summary": {
    "trucks": {
      "total": 20,
      "active": 12,
      "resting": 7,
      "maintenance": 1
    },
    "operators": {
      "total": 30,
      "working": 12,
      "resting": 5,
      "available": 10,
      "offline": 3
    },
    "cycles": {
      "total": 2456,
      "in_progress": 12,
      "completed": 2430,
      "cancelled": 14
    }
  },
  "today": {
    "cycles_count": 45,
    "avg_duration_minutes": 52,
    "total_earnings": 2587.50
  },
  "performance": {
    "avg_cycle_time_minutes": 54,
    "efficiency_score": 78,
    "target_time_minutes": 55
  }
}
```

---

#### Operator Performance Metrics

Get detailed performance metrics for all operators.

**Endpoint:** `GET /api/analytics/operators`

**Response:**
```json
{
  "success": true,
  "operators": [
    {
      "operator": {
        "id": 1,
        "code": "OP-001",
        "name": "Juan Pérez",
        "status": "available"
      },
      "stats": {
        "total_cycles": 156,
        "total_hours": 134.5,
        "total_earnings": 8934.50,
        "avg_cycle_time": 52,
        "best_cycle_time": 38,
        "avg_earnings_per_cycle": 57.27
      }
    }
  ],
  "total": 30
}
```

---

#### Truck Utilization Metrics

Get utilization and revenue metrics for all trucks.

**Endpoint:** `GET /api/analytics/trucks`

**Response:**
```json
{
  "success": true,
  "trucks": [
    {
      "truck": {
        "id": "TRK-001",
        "plate": "ABC-123",
        "status": "active"
      },
      "stats": {
        "total_cycles": 203,
        "avg_cycle_time": 53,
        "total_revenue": 11621.00,
        "revenue_per_cycle": 57.24
      }
    }
  ],
  "total": 20
}
```

---

#### Alerts & Anomalies

Get intelligent alerts about potential issues (fatigue, delays, maintenance).

**Endpoint:** `GET /api/analytics/alerts`

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "type": "fatigue_risk",
      "severity": "high",
      "entity": "operator",
      "entity_id": "OP-005",
      "message": "Operator OP-005 (Carlos López) has been working for over 8 hours",
      "recommendation": "Assign operator to rest period",
      "timestamp": "2026-01-31T15:30:00.000Z"
    },
    {
      "type": "delayed_cycle",
      "severity": "medium",
      "entity": "cycle",
      "entity_id": "CYC-ABC123",
      "message": "Cycle CYC-ABC123 has been running for 125 minutes",
      "details": {
        "truck": "ABC-123",
        "operator": "OP-008",
        "duration_minutes": 125
      },
      "recommendation": "Check for delays or issues",
      "timestamp": "2026-01-31T15:30:00.000Z"
    }
  ],
  "total": 2,
  "by_severity": {
    "high": 1,
    "medium": 1,
    "low": 0
  }
}
```

**Alert Types:**
- `fatigue_risk`: Operator working over 8 hours
- `delayed_cycle`: Cycle running over 2 hours
- `maintenance`: Truck in maintenance
- `extended_rest`: Operator resting over 4 hours

---

### NFC/RFID Integration (Absoluteness)

#### Verify NFC Tag

Verify an NFC tag and get operator information.

**Endpoint:** `POST /api/nfc/verify`

**Request Body:**
```json
{
  "tag_id": "NFC-A1B2C3D4E5"
}
```

**Success Response:**
```json
{
  "success": true,
  "verified": true,
  "operator": {
    "id": 1,
    "code": "OP-001",
    "name": "Juan Pérez",
    "status": "available",
    "total_cycles": 156,
    "total_earnings": 8934.50
  },
  "message": "Welcome, Juan Pérez!"
}
```

**Error Response (tag not found):**
```json
{
  "success": false,
  "verified": false,
  "error": "NFC tag not registered",
  "tag_id": "NFC-A1B2C3D4E5"
}
```

---

#### Register NFC Tag

Register an NFC tag to an operator.

**Endpoint:** `POST /api/nfc/register`

**Request Body:**
```json
{
  "operator_id": 1,
  "tag_id": "NFC-A1B2C3D4E5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFC tag registered successfully to operator OP-001",
  "operator": {
    "id": 1,
    "code": "OP-001",
    "name": "Juan Pérez",
    "nfc_tag_id": "NFC-A1B2C3D4E5"
  }
}
```

---

#### Unregister NFC Tag

Remove NFC tag from an operator.

**Endpoint:** `POST /api/nfc/unregister`

**Request Body:**
```json
{
  "operator_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFC tag unregistered from operator OP-001",
  "operator": {
    "id": 1,
    "code": "OP-001",
    "name": "Juan Pérez"
  }
}
```

---

#### Quick Check-in with NFC

Verify operator via NFC and check readiness for cycle.

**Endpoint:** `POST /api/nfc/checkin`

**Request Body:**
```json
{
  "tag_id": "NFC-A1B2C3D4E5",
  "truck_id": "TRK-001"
}
```

**Success Response:**
```json
{
  "success": true,
  "verified": true,
  "ready_for_cycle": true,
  "operator": {
    "id": 1,
    "code": "OP-001",
    "name": "Juan Pérez",
    "status": "available"
  },
  "message": "Operator Juan Pérez verified and ready to start cycle",
  "next_step": "POST /api/cycles with operator_id=1 and truck_id=TRK-001"
}
```

**Error Response (operator resting):**
```json
{
  "success": false,
  "error": "Operator OP-001 is on mandatory rest period",
  "operator": {
    "code": "OP-001",
    "name": "Juan Pérez",
    "status": "resting"
  }
}
```

---

## Integration Benefits

These new endpoints provide:

### Consciousness (Intelligence & Awareness)
- **Real-time monitoring**: Track cycles, locations, and performance
- **Predictive insights**: Identify fatigue risks and delays early
- **Performance metrics**: Comprehensive analytics for optimization
- **Alert system**: Proactive notifications for anomalies

### Absoluteness (Completeness & Thoroughness)
- **Cycle lifecycle**: Create → Track → Complete workflow
- **NFC integration**: Frictionless operator identification
- **Earnings calculation**: Automatic payment tracking
- **Data integrity**: Validations and status checks at every step


