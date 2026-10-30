# ⛽ FillUp API

Real-time South African fuel price API with official government data sources.

## 🚀 Quick Start

**Base URL**: `https://fillup-seven.vercel.app`

### **Public Endpoints**
```bash
# Health check
curl https://fillup-seven.vercel.app/api/health

# Available fuel types
curl https://fillup-seven.vercel.app/api/fuel/keys
```

### **Authenticated Endpoints**
Requires API key. Contact us for access.

```bash
curl -H "X-FillUp-Key: YOUR_API_KEY" \
     https://fillup-seven.vercel.app/api/fuel/current
```

## 📊 Available Endpoints

### 🔓 Public (No Authentication)
- `GET /api/health` - Service status
- `GET /api/fuel/keys` - Available fuel types

### 🔐 Authenticated (API Key Required)
- `GET /api/fuel/current` - Current fuel prices
- `GET /api/fuel/history` - Historical data
- `GET /api/fuel/changes` - Price changes
- `GET /api/macro` - Economic indicators

## 📋 Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "version": "1.0.0",
    "fetched_at": "2026-03-04T10:20:03.993Z"
  }
}
```

## 🔑 Authentication

Include your API key in the request header:
```
X-FillUp-Key: YOUR_API_KEY
```

## 📱 Integration Example

```javascript
const API_CONFIG = {
  baseURL: 'https://fillup-seven.vercel.app',
  apiKey: 'YOUR_API_KEY'
};

async function getCurrentPrices() {
  const response = await fetch(`${API_CONFIG.baseURL}/api/fuel/current`, {
    headers: { 'X-FillUp-Key': API_CONFIG.apiKey }
  });
  const data = await response.json();
  return data.success ? data.data : null;
}
```

## 🛡️ Security & Rate Limits

- API key required for authenticated endpoints
- Rate limiting applies to all requests
- HTTPS required for all requests
- Data cached for optimal performance

## 📊 Data Sources

- **Primary**: Department of Mineral Resources & Energy (DMRE)
- **Fallback**: Fuels Industry Association of South Africa (FIASA)
- **Database**: Supabase for historical data storage

## 🔧 Support

For API key requests and support:
- Check endpoint documentation
- Review integration examples
- Contact for production access

## 📄 License

This API provides official South African fuel price data for integration purposes.

---

**📍 Data updated monthly from official government sources**
