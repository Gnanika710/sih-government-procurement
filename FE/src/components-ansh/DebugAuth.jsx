import React, { useState } from 'react';
import { toast } from 'react-toastify';

const DebugAuth = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:3000/test');
      const data = await response.json();
      setResults(prev => ({ ...prev, backend: data }));
      toast.success('Backend connection successful');
    } catch (error) {
      toast.error('Backend connection failed');
      setResults(prev => ({ ...prev, backend: { error: error.message } }));
    }
  };

  const testDatabase = async () => {
    try {
      const response = await fetch('http://localhost:3000/debug/db');
      const data = await response.json();
      setResults(prev => ({ ...prev, database: data }));
      toast.success('Database connection successful');
    } catch (error) {
      toast.error('Database connection failed');
      setResults(prev => ({ ...prev, database: { error: error.message } }));
    }
  };

  const testSignup = async () => {
    setLoading(true);
    try {
      const testData = {
        username: 'debuguser123',
        email: 'debug@test.com',
        password: 'password123',
        userType: 'government'
      };

      const response = await fetch('http://localhost:3000/debug/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      setResults(prev => ({ ...prev, signup: data }));
      
      if (data.success) {
        toast.success('Debug signup successful!');
      } else {
        toast.error('Debug signup failed: ' + data.message);
      }
    } catch (error) {
      toast.error('Debug signup error: ' + error.message);
      setResults(prev => ({ ...prev, signup: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testBackend}
            className="bg-blue-500 text-white p-4 rounded hover:bg-blue-600"
          >
            Test Backend Connection
          </button>
          
          <button
            onClick={testDatabase}
            className="bg-green-500 text-white p-4 rounded hover:bg-green-600"
          >
            Test Database Connection
          </button>
          
          <button
            onClick={testSignup}
            disabled={loading}
            className="bg-purple-500 text-white p-4 rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            {loading ? 'Testing...' : 'Test Debug Signup'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Debug Results:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth;