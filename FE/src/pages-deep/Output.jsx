import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react/dist/iconify.js';
import Footer from '../components-ansh/Footer';
const Output = () => {
  const [formData, setFormData] = useState({
    itemName: '',
    seller: '',
    model: '',
    category: 'construction', // Default category
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averagePrice, setAveragePrice] = useState(null);
  const [topSuggestions, setTopSuggestions] = useState([]);

  const calculateReasonabilityScore = (rating, reviews) => {
    return Math.min(100, (rating * 20) + (reviews / 10));
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

    try {
      const response = await fetch(`http://127.0.0.1:8000/scrape-make-model/${formData.category}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_name: formData.itemName,
          seller: formData.seller,
          model: formData.model,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setData(result);

      // Calculate the average price
      const prices = result.map(item => parseFloat(item.Price.replace(/[^0-9.-]+/g, "")));
      const avgPrice = prices.reduce((acc, price) => acc + price, 0) / prices.length;
      setAveragePrice(avgPrice.toFixed(2));

      // Identify top three suggestions
      const scores = result.map((item, index) => ({
        ...item,
        reasonabilityScore: calculateReasonabilityScore(item.Rating, item.Reviews),
      }));
      const topThree = scores
        .slice()
        .sort((a, b) => b.reasonabilityScore - a.reasonabilityScore)
        .slice(0, 3);
      setTopSuggestions(topThree);
    } catch (err) {
      setError(err.message);
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
            <option value="construction">Construction</option>
            <option value="electronics">Electronics</option>
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
            placeholder="Enter item name"
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
            placeholder="Enter seller name"
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
            placeholder="Enter model"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Submit
        </button>
      </form>
      </div>
      {/* Loading Indicator */}
      {loading && <p className="mt-4 text-white">Loading...</p>}

      {/* Error Message */}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}

      {/* Data Table */}
      {data.length > 0 && (
        <div className="mt-8">
          <h3 className="text-3xl font-semibold mb-4 text-white text-center">Results</h3>
          {/* Display Average Price */}
          {averagePrice && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
              <p>Estimated Price: ₹{averagePrice}</p>
            </div>
          )}

          {/* Top Suggestions */}
          {topSuggestions.length > 0 && (
            <div className="mt-8 p-4 bg-blue-100 text-blue-800 rounded-md mb-10">
              <h3 className="text-xl font-semibold mb-4">Top Suggestions</h3>
              <ul className="space-y-2">
                {topSuggestions.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <a href={item.Website} target="_blank" rel="noopener noreferrer"><span>{item['Product Name']}</span></a>
                    <span>Score: {item.reasonabilityScore}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-md">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Item Name</th>
                  <th className="py-2 px-4 border-b">Specifications</th>
                  <th className="py-2 px-4 border-b">Source</th>
                  <th className="py-2 px-4 border-b">Price</th>
                  <th className="py-2 px-4 border-b">Last Updated</th>
                  <th className="py-2 px-4 border-b">Rating</th>
                  <th className="py-2 px-4 border-b">Reviews</th>
                  <th className="py-2 px-4 border-b">Reasonability Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{item['Product Name']}</td>
                    <td className="py-2 px-4 border-b">{item.specifications}</td>
                    <td className="py-2 px-4 border-b"><a href={item.Website} target="_blank" rel="noopener noreferrer">{item.Seller}</a></td>
                    <td className="py-2 px-4 border-b">{item.Price}</td>
                    <td className="py-2 px-4 border-b">{item.last_updated}</td>
                    <td className="py-2 px-4 border-b">{item.Rating}</td>
                    <td className="py-2 px-4 border-b">{item.Reviews}</td>
                    <td className="py-2 px-4 border-b">{calculateReasonabilityScore(item.Rating, item.Reviews)}</td>
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