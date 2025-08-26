# NyambikaAI Python Service 🐍

AI-powered virtual try-on service using ClothFlow technology for fashion e-commerce.

## 🚀 Features

- **Virtual Try-On**: Advanced AI clothing simulation
- **Image Processing**: Automatic background removal and cloth trimming
- **RESTful API**: FastAPI-based service with async support
- **Real-time Processing**: Efficient image processing pipeline

## 📦 Installation

1. **Navigate to Python service directory:**
   ```bash
   cd python/clothflow_service
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## 🔧 Configuration

Create a `.env` file in the `clothflow_service` directory:

```env
# API Configuration
PORT=8000
HOST=0.0.0.0

# ClothFlow API (if using external service)
CLOTHFLOW_API_URL=your_clothflow_api_url
CLOTHFLOW_API_KEY=your_api_key

# File Storage
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
```

## 🏃‍♂️ Running the Service

### Development Mode
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Virtual Try-On
```
POST /api/tryon
Content-Type: multipart/form-data

Parameters:
- person_image: File (user photo)
- cloth_image: File (clothing item)
- session_id: String (optional)
```

### Get Try-On Result
```
GET /api/tryon/{session_id}
```

## 🏗️ Project Structure

```
python/
├── clothflow_service/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env                # Environment variables
│   ├── inputs/             # Input images storage
│   ├── outputs/            # Generated try-on results
│   └── .venv/              # Virtual environment
└── README.md               # This file
```

## 🔗 Integration with Other Services

This Python service integrates with:
- **Frontend**: React app sends try-on requests
- **Backend**: Node.js API proxies requests and manages sessions

Default service runs on `http://localhost:8000`

## 🐳 Docker Support (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 Development Notes

- Service handles image preprocessing automatically
- Supports multiple image formats (JPG, PNG, WEBP)
- Implements proper error handling and validation
- Uses async/await for better performance
