# DataSpeaks Server - Clean Architecture

## 📁 Project Structure

```
server/
├── controllers/          # Request handlers (presentation layer)
│   ├── queryController.js
│   ├── uploadController.js
│   └── ragController.js     # NEW: RAG operations controller
├── services/            # Business logic (service layer)
│   ├── aiQueryService.js
│   ├── mongoService.js
│   ├── sqlQueryService.js
│   ├── sqlService.js
│   ├── ragService.js        # NEW: RAG service (SOLID)
│   └── vectorStoreManager.js # NEW: Vector store management (SOLID)
├── routes/              # API routes
│   ├── mongoRoutes.js
│   ├── queryRoutes.js
│   ├── sqlRoutes.js
│   ├── uploadRoutes.js
│   └── ragRoutes.js         # NEW: RAG endpoints
├── utils/               # Utility functions
│   ├── embeddingsStore.js
│   ├── exelProcessor.js
│   └── pdfProcessor.js
├── middleware/          # Express middleware
│   └── uploadMiddleware.js
└── server.js            # Application entry point (clean & minimal)
```

## 🎯 SOLID Principles Applied

### 1. **Single Responsibility Principle (SRP)**
Each class/module has one reason to change:

- **RAGService**: Handles QA chain operations only
- **VectorStoreManager**: Manages vector store CRUD operations only
- **ragController**: Handles HTTP request/response only
- **ragRoutes**: Defines routes and middleware only

### 2. **Open/Closed Principle (OCP)**
- Services are open for extension (can add new methods)
- Closed for modification (existing methods remain stable)

### 3. **Liskov Substitution Principle (LSP)**
- Service instances can be replaced with mock implementations for testing

### 4. **Interface Segregation Principle (ISP)**
- Each service exposes only relevant methods
- No fat interfaces

### 5. **Dependency Inversion Principle (DIP)**
- Controllers depend on services (abstractions)
- Not on concrete implementations

## 🔄 Request Flow

```
Client Request
    ↓
Express Router (ragRoutes.js)
    ↓
Controller (ragController.js)
    ↓
Services (ragService.js, vectorStoreManager.js)
    ↓
Utils (pdfProcessor.js, embeddingsStore.js)
    ↓
Response
```

## 📡 API Endpoints

### RAG Endpoints

#### Upload Document
```http
POST /api/rag/upload
Content-Type: multipart/form-data

{
  "file": <PDF file>
}

Response:
{
  "fileId": "abc123",
  "message": "File uploaded and processed successfully",
  "chunksCount": 42
}
```

#### Query Document
```http
POST /api/rag/query
Content-Type: application/json

{
  "fileId": "abc123",
  "question": "What is this document about?"
}

Response:
{
  "answer": "This document is about...",
  "fileId": "abc123",
  "question": "What is this document about?"
}
```

#### Get Statistics
```http
GET /api/rag/stats

Response:
{
  "totalDocuments": 5,
  "message": "RAG service statistics"
}
```

### Legacy Endpoints (Backward Compatible)
- `POST /api/upload` → redirects to `/api/rag/upload`
- `POST /api/query` → redirects to `/api/rag/query`

## 🏗️ Architecture Benefits

### ✅ Maintainability
- Clean separation of concerns
- Easy to locate and fix bugs
- Each file has a clear purpose

### ✅ Testability
- Services can be unit tested independently
- Easy to mock dependencies
- Controllers can be integration tested

### ✅ Scalability
- Easy to add new features
- Services can be extracted to microservices
- Can swap implementations (e.g., change vector DB)

### ✅ Readability
- Clear file structure
- Self-documenting code
- Consistent patterns

## 🔧 Key Components

### RAGService
- Manages AI model initialization
- Handles QA chain creation
- Processes queries with retrieval

### VectorStoreManager
- Singleton pattern for global access
- CRUD operations for vector stores
- Memory-efficient storage management

### ragController
- Input validation
- Error handling
- Response formatting

## 🚀 Future Improvements

1. **Add Dependency Injection**: Use a DI container
2. **Add Interfaces**: TypeScript interfaces for type safety
3. **Add Logging Service**: Centralized logging
4. **Add Caching Layer**: Redis for vector store caching
5. **Add Rate Limiting**: Protect API endpoints
6. **Add Authentication**: JWT-based auth
7. **Migrate to Persistent Vector DB**: Pinecone/Chroma
8. **Add Testing**: Unit tests, integration tests

## 📝 Notes

- Vector stores are currently in-memory (lost on restart)
- File uploads limited to 10MB
- Only PDF files supported
- Consider adding file cleanup cron job
