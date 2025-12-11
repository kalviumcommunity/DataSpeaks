# DataSpeaks 🎯

> **AI-Powered SQL Analytics Platform** - Query your databases in plain English, no SQL knowledge required.

## 🎯 What is DataSpeaks?

DataSpeaks transforms how non-technical users interact with databases. Instead of writing complex SQL queries, users simply ask questions in natural language like "Who are my top 10 customers?" or "Show me sales trends this month" and get instant results with automatic visualizations.

## 💡 Problem it Solves

### Traditional Challenges:
- ❌ **Technical Barrier**: Business users need SQL developers to extract insights
- ❌ **Time Delays**: Simple data requests take hours/days waiting for developer availability
- ❌ **Cost**: Hiring SQL experts for basic reporting is expensive
- ❌ **Lost Opportunities**: Insights delayed = decisions delayed = opportunities missed

### DataSpeaks Solution:
- ✅ **Zero SQL Knowledge**: Ask questions in plain English
- ✅ **Instant Results**: Get answers in seconds, not hours
- ✅ **Self-Service Analytics**: Empower non-technical teams
- ✅ **Multi-Database**: Works with MySQL, PostgreSQL, SQLite, SQL Server
- ✅ **Auto-Visualization**: Charts automatically created from results
- ✅ **100% Privacy**: Runs AI locally (Ollama), no data leaves your network

## 🚀 Key Features

### 🗣️ Natural Language to SQL
- **Ask Questions Like**: "How many active users do we have?"
- **Get Accurate SQL**: `SELECT COUNT(*) FROM users WHERE status = 'active'`
- **See Explanations**: AI explains what the query does in plain English
- **Safety First**: Only SELECT queries allowed, no data modification

### 🎨 Auto-Visualization
- **Smart Chart Detection**: Automatically picks bar, line, pie, or scatter charts
- **Interactive Dashboards**: Save queries and build custom dashboards
- **Export Options**: Download results as CSV for external analysis

### 🔐 Google OAuth Authentication
- **Secure Login**: Sign in with your Google account
- **Session Management**: Persistent authentication with JWT tokens
- **User Profiles**: Track your queries and dashboards

### 🗄️ Multi-Database Support
| Database | Status | Use Case |
|----------|--------|----------|
| MySQL 🐬 | ✅ Full Support | Web applications, e-commerce |
| PostgreSQL 🐘 | ✅ Full Support | Enterprise apps, complex queries |
| SQLite 📁 | ✅ Full Support | Embedded, local development |
| SQL Server 🗄️ | ✅ Full Support | Microsoft stack, enterprise |

### 🤖 Local AI (Ollama + Mistral)
- **No API Costs**: Runs entirely on your machine
- **No Rate Limits**: Query as much as you want
- **100% Private**: Your data never leaves your network
- **Fast**: Local inference means quick responses

## 🛠️ Tech Stack

**Frontend:**
- React 19.1.1 + Vite 7.1.2
- Tailwind CSS 4.1.11 (Warm orange/amber theme)
- Recharts (Data visualization)
- Modern, responsive UI

**Backend:**
- Node.js v22.17.1 + Express 5.x
- ES Modules architecture
- Passport.js (Google OAuth)
- Multi-database drivers (mysql2, pg, sqlite3, mssql)

**AI Layer:**
- Ollama (Local LLM runtime)
- Mistral model (SQL generation)
- LangChain for prompt engineering
- Temperature: 0.1 (precise SQL generation)

## 🚦 Quick Start

### Prerequisites
```bash
# Required
- Node.js 22+ 
- Ollama installed (https://ollama.ai)
- Google Cloud account (for OAuth)
- Any SQL database (MySQL, PostgreSQL, SQLite, or SQL Server)
```

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/kalviumcommunity/DataSpeaks.git
cd DataSpeaks
```

**2. Install Ollama and Mistral**
```bash
# Install Ollama from https://ollama.ai
# Then pull Mistral model
ollama pull mistral
```

**3. Set up Google OAuth**
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create new project → Enable Google+ API
- Create OAuth 2.0 credentials
- Add authorized redirect: `http://localhost:3000/api/auth/google/callback`

**4. Configure environment variables**
```bash
# Create server/.env file
cd server
cat > .env << EOF
PORT=3000
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Security
SESSION_SECRET=your-random-session-secret-change-in-production
ENCRYPTION_KEY=your-32-char-encryption-key-for-db-strings

# Frontend
FRONTEND_URL=http://localhost:5173
EOF
```

**5. Install dependencies**
```bash
# Backend
cd server
npm install

# Frontend (in new terminal)
cd ../client
npm install
```

**6. Start Ollama**
```bash
# Ensure Ollama is running
ollama serve
```

**7. Start development servers**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

**8. Open application**
```
🚀 Frontend: http://localhost:5173
🔧 Backend:  http://localhost:3000
🤖 Ollama:   http://localhost:11434
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
