import { useState } from 'react';

const DatabaseSelectionPage = ({ onSelectDatabase }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const databaseTypes = [
    {
      id: 'sql',
      name: 'SQL Databases',
      icon: '🗄️',
      description: 'MySQL, PostgreSQL, SQLite, SQL Server',
      features: [
        'Structured relational data',
        'ACID transactions',
        'Complex joins and relationships',
        'Perfect for traditional applications'
      ],
      color: 'from-orange-500 to-amber-500',
      useCases: ['E-commerce', 'CRM Systems', 'Financial Apps']
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      icon: '🍃',
      description: 'NoSQL Document Database',
      features: [
        'Flexible document schema',
        'Horizontal scalability',
        'JSON-like documents',
        'Perfect for dynamic data'
      ],
      color: 'from-green-500 to-emerald-500',
      useCases: ['Content Management', 'Real-time Analytics', 'IoT Data']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-amber-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Choose Your Database Type
          </h1>
          <p className="text-xl text-gray-600">
            Select the type of database you want to query with natural language
          </p>
        </div>

        {/* Database Cards */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {databaseTypes.map((db) => (
            <div
              key={db.id}
              onMouseEnter={() => setHoveredCard(db.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectDatabase(db.id)}
              className={`
                relative bg-white/90 backdrop-blur-md rounded-3xl p-8 
                border-2 transition-all duration-300 cursor-pointer
                ${hoveredCard === db.id 
                  ? 'border-transparent shadow-2xl scale-105 -translate-y-2' 
                  : 'border-gray-200 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {/* Gradient Border Effect */}
              {hoveredCard === db.id && (
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${db.color} opacity-20 -z-10`}></div>
              )}

              {/* Icon & Title */}
              <div className="text-center mb-6">
                <div className="text-7xl mb-4 animate-bounce">
                  {db.icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {db.name}
                </h2>
                <p className="text-gray-600 text-lg">
                  {db.description}
                </p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Key Features
                </h3>
                <ul className="space-y-2">
                  {db.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Use Cases */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Perfect For
                </h3>
                <div className="flex flex-wrap gap-2">
                  {db.useCases.map((useCase, idx) => (
                    <span
                      key={idx}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${hoveredCard === db.id
                          ? `bg-gradient-to-r ${db.color} text-white`
                          : 'bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                className={`
                  w-full py-4 rounded-xl font-semibold text-lg
                  transition-all duration-300
                  ${hoveredCard === db.id
                    ? `bg-gradient-to-r ${db.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Connect to {db.name}
              </button>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 border border-orange-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              🤖 AI-Powered Natural Language Queries
            </h3>
            <p className="text-gray-600 text-lg mb-4">
              No matter which database you choose, ask questions in plain English:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-700 mb-1">SQL Example:</p>
                <p className="text-gray-700">"Show me top 10 customers by revenue"</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700 mb-1">MongoDB Example:</p>
                <p className="text-gray-700">"Find all users who signed up this month"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSelectionPage;
