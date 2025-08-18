# DataSpeaks - MongoDB Natural Language Query Platform

A comprehensive AI-powered platform that enables users to query MongoDB databases and PDF documents using natural language. Built with React, Node.js, and Google Gemini AI.

## 🚀 Features

### MongoDB Natural Language Queries
- **Database Connection**: Securely connect to any MongoDB database using connection strings
- **Natural Language Processing**: Convert plain English questions into optimized MongoDB queries
- **Query Execution**: Safe, read-only operations with comprehensive error handling
- **Real-time Results**: Instant query results with explanations
- **Query Transparency**: See the generated MongoDB queries alongside results
- **Sample Questions**: AI-generated relevant questions based on your database schema

### PDF Document Q&A (RAG)
- **PDF Upload**: Support for any PDF document
- **Intelligent Chunking**: Advanced text splitting and embedding
- **Contextual Answers**: Retrieval-Augmented Generation for accurate responses
- **Source Attribution**: See which parts of the document were used

## 🛠 Tech Stack

**Backend:**
- Node.js + Express
- MongoDB Node.js Driver
- LangChain (Document processing, embeddings)
- Google Gemini AI (Text generation, embeddings)
- Multer (File uploads)
- UUID (Connection management)

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Modern responsive design
- Real-time chat interface

**AI & ML:**
- Google Gemini 2.0-flash (Query generation)
- Google text-embedding-004 (Document embeddings)
- Advanced prompt engineering for MongoDB query generation

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB database (local or cloud)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kalviumcommunity/DataSpeaks.git
   cd DataSpeaks
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file in project root
   GEMINI_API_KEY='your-gemini-api-key-here'
   ENCRYPTION_KEY='your-32-character-secret-key-here!'
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

5. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

## 📋 API Endpoints

### MongoDB Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mongo/test` | Test database connection |
| POST | `/api/mongo/connect` | Connect and get collections |
| GET | `/api/mongo/:id/collections` | List collections |
| POST | `/api/mongo/:id/query` | Execute natural language query |
| GET | `/api/mongo/:id/samples` | Get sample questions |
| GET | `/api/mongo/:id/status` | Connection status |
| DELETE | `/api/mongo/:id` | Disconnect |

### PDF Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload and process PDF |
| POST | `/api/query` | Query PDF content |

## 🔒 Security Features

- **Connection Encryption**: All connection strings are encrypted before storage
- **Read-only Operations**: Only safe database operations are allowed
- **Query Validation**: AI-generated queries are validated for safety
- **Rate Limiting**: Built-in protection against abuse
- **Secure Headers**: CORS and security headers configured
- **Input Sanitization**: All inputs are validated and sanitized

## 🎯 Usage Examples

### MongoDB Queries
```
Natural Language → Generated Query
"How many users are there?" → db.users.countDocuments({})
"Find active users" → db.users.find({active: true})
"Show recent orders" → db.orders.find({}).sort({createdAt: -1}).limit(10)
"Get unique cities" → db.users.distinct("city")
"Users from last month" → db.users.find({createdAt: {$gte: new Date("2024-12-01")}})
```

### PDF Questions
```
"What is the main topic of this document?"
"Summarize the key findings"
"What are the technical requirements mentioned?"
"Find information about pricing"
```

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   MongoDB DB    │
│                 │◄──►│                 │◄──►│                 │
│  - Connection   │    │  - AI Service   │    │  - User Data    │
│  - Query UI     │    │  - Mongo Service│    │  - Collections  │
│  - Results      │    │  - Security     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │
         │                        ▼
         │              ┌─────────────────┐
         └─────────────►│  Google Gemini  │
                        │                 │
                        │  - NL → Query   │
                        │  - Explanations │
                        │  - Embeddings   │
                        └─────────────────┘
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
GEMINI_API_KEY='your-gemini-api-key'
ENCRYPTION_KEY='your-32-char-encryption-key'

# Optional
PORT=3000
NODE_ENV=development
```

### MongoDB Connection Examples
```bash
# Local MongoDB
mongodb://localhost:27017/myapp

# MongoDB Atlas
mongodb+srv://username:password@cluster.mongodb.net/database

# MongoDB with authentication
mongodb://username:password@host:port/database
```

## 🧪 Testing

### Test MongoDB Connection
```bash
curl -X POST http://localhost:3000/api/mongo/test \
  -H "Content-Type: application/json" \
  -d '{"connectionString": "mongodb://localhost:27017/test"}'
```

### Test Natural Language Query
```bash
curl -X POST http://localhost:3000/api/mongo/{connectionId}/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How many documents are in the users collection?"}'
```

## 🚀 Deployment

### Production Build
```bash
# Build client
cd client && npm run build

# Start server
cd ../server && npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Use strong encryption keys
- Configure CORS for your domain
- Set up MongoDB Atlas for cloud database
- Use environment-specific API keys

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language processing
- LangChain for document processing capabilities
- MongoDB team for excellent database tools
- React and Tailwind CSS communities

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

Built with ❤️ by the DataSpeaks team
# speak_with_data
