# 📡 Tractocamión 4.0 - API Documentation

## Base URL

```
http://localhost:3000/api
```

---

## Endpoints

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
