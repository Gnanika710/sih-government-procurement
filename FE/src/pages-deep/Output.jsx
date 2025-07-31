import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Footer from '../components-ansh/Footer';

const Output = () => {
  const [formData, setFormData] = useState({
    itemName: '',
    seller: '',
    model: '',
    category: 'electronics', // Changed default to electronics for your test
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averagePrice, setAveragePrice] = useState(null);
  const [topSuggestions, setTopSuggestions] = useState([]);

  const calculateReasonabilityScore = (rating, reviews) => {
    // Handle different rating formats
    let numericRating = 0;
    let numericReviews = 0;
    
    if (typeof rating === 'string') {
      // Extract number from "4.2 stars" format
      const ratingMatch = rating.match(/(\d+\.?\d*)/);
      numericRating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    } else {
      numericRating = parseFloat(rating) || 0;
    }
    
    if (typeof reviews === 'string') {
      // Extract number from "150 reviews" format
      const reviewsMatch = reviews.match(/(\d+)/);
      numericReviews = reviewsMatch ? parseInt(reviewsMatch[1]) : 0;
    } else {
      numericReviews = parseInt(reviews) || 0;
    }
    
    return Math.min(100, (numericRating * 20) + (numericReviews / 10));
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData([]);
    setAveragePrice(null);
    setTopSuggestions([]);

    try {
      console.log('🚀 Starting search with:', formData);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`http://127.0.0.1:8000/scrape-make-model/${formData.category}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          item_name: formData.itemName,
          seller: formData.seller || null,
          model: formData.model || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      // Handle the new API response structure
      let productsArray = [];
      
      if (result.results && Array.isArray(result.results)) {
        // New API structure: { results: [...] }
        productsArray = result.results;
        console.log('✅ Found results array with', productsArray.length, 'products');
      } else if (Array.isArray(result)) {
        // Fallback: direct array
        productsArray = result;
        console.log('✅ Found direct array with', productsArray.length, 'products');
      } else {
        console.error('❌ Unexpected API response structure:', result);
        throw new Error('Invalid response format from server');
      }

      if (productsArray.length === 0) {
        throw new Error('No products found for your search criteria');
      }

      setData(productsArray);

      // Calculate the average price
      const prices = productsArray
        .map(item => {
          const priceStr = item.Price || item.price || '0';
          const numericPrice = parseFloat(priceStr.replace(/[^0-9.-]+/g, ""));
          return isNaN(numericPrice) ? 0 : numericPrice;
        })
        .filter(price => price > 0);
      
      if (prices.length > 0) {
        const avgPrice = prices.reduce((acc, price) => acc + price, 0) / prices.length;
        setAveragePrice(avgPrice.toFixed(2));
      }

      // Identify top three suggestions
      const scores = productsArray.map((item, index) => ({
        ...item,
        reasonabilityScore: calculateReasonabilityScore(item.Rating, item.Reviews),
      }));
      
      const topThree = scores
        .slice()
        .sort((a, b) => b.reasonabilityScore - a.reasonabilityScore)
        .slice(0, 3);
      setTopSuggestions(topThree);

      console.log('✅ Search completed successfully!');

    } catch (err) {
      console.error('❌ Search error:', err);
      if (err.name === 'AbortError') {
        setError('Search timed out. Please try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark min-h-screen">
      <div className=' p-12'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-white'>
            <div className="flex justify-center items-center mb-4">
              <Icon icon="simple-icons:cmake" className="text-white text-8xl m-5" />
            </div>

            <h2 className="text-2xl font-bold mb-4 text-center">Search by Make/Model</h2>
            <p className="mb-4 text-center">Find products based on make or model to streamline your procurement process.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dropdown for Item Type */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Item Type
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="electronics">Electronics</option>
                <option value="construction">Construction</option>
                <option value="medical">Medical</option>
              </select>
            </div>

            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                placeholder="Enter item name (e.g., laptop, smartphone)"
              />
            </div>

            <div>
              <label htmlFor="seller" className="block text-sm font-medium text-gray-700">
                Seller
              </label>
              <input
                type="text"
                id="seller"
                name="seller"
                value={formData.seller}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter seller name (e.g., HP, Samsung)"
              />
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter model (e.g., i5, Galaxy S23)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Searching...' : 'Submit'}
            </button>
          </form>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-4 text-white text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2">Searching for products... Please wait.</p>
            <p className="text-sm text-gray-300">This may take up to 30 seconds.</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md max-w-4xl mx-auto">
            <p><strong>Error:</strong> {error}</p>
            <div className="mt-2 text-sm">
              <p><strong>Troubleshooting:</strong></p>
              <ul className="list-disc ml-5">
                <li>Make sure the Python server is running on port 8000</li>
                <li>Check your internet connection</li>
                <li>Try with different search terms</li>
              </ul>
            </div>
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <div className="mt-8 max-w-6xl mx-auto">
            <h3 className="text-3xl font-semibold mb-4 text-white text-center">
              Search Results ({data.length} products found)
            </h3>
            
            {/* Display Average Price */}
            {averagePrice && (
              <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
                <p><strong>Estimated Average Price:</strong> ₹{averagePrice}</p>
              </div>
            )}

            {/* Top Suggestions */}
            {topSuggestions.length > 0 && (
              <div className="mt-8 p-4 bg-blue-100 text-blue-800 rounded-md mb-10">
                <h3 className="text-xl font-semibold mb-4">🏆 Top Recommendations</h3>
                <ul className="space-y-2">
                  {topSuggestions.map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <a 
                        href={item.Website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        <span>{item['Product Name']}</span>
                      </a>
                      <span className="bg-blue-200 px-2 py-1 rounded">
                        Score: {item.reasonabilityScore.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-md">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 border-b font-semibold text-left">Product Name</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Specifications</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Seller</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Price</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Rating</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Reviews</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Score</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">
                        <a 
                          href={item.Website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {item['Product Name']}
                        </a>
                      </td>
                      <td className="py-2 px-4 border-b">{item.Specifications || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{item.Seller}</td>
                      <td className="py-2 px-4 border-b font-semibold text-green-600">{item.Price}</td>
                      <td className="py-2 px-4 border-b">{item.Rating}</td>
                      <td className="py-2 px-4 border-b">{item.Reviews}</td>
                      <td className="py-2 px-4 border-b">
                        <span className="bg-gray-200 px-2 py-1 rounded text-sm">
                          {calculateReasonabilityScore(item.Rating, item.Reviews).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b text-sm text-gray-600">
                        {item['Last Updated'] || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
};

export default Output;