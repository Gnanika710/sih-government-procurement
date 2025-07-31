import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Footer from "../components-ansh/Footer";

const Output2 = () => {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "construction", // Default category
    specifications: [{ specification_name: "", value: "" }],
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

  // Handle input changes for the main form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle input changes for specifications
  const handleSpecificationChange = (index, e) => {
    const { name, value } = e.target;
    const newSpecifications = [...formData.specifications];
    newSpecifications[index][name] = value;
    setFormData((prev) => ({
      ...prev,
      specifications: newSpecifications,
    }));
  };

  // Add a new specification field
  const addSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { specification_name: "", value: "" },
      ],
    }));
  };

  // Remove a specification field
  const removeSpecification = (index) => {
    const newSpecifications = formData.specifications.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      specifications: newSpecifications,
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
      console.log('🚀 Starting specification search with:', formData);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `http://127.0.0.1:8000/scrape-specs/${formData.category}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            item_name: formData.itemName,
            specifications: formData.specifications,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      // Handle different response structures
      let productsArray = [];
      
      if (result.results && Array.isArray(result.results)) {
        // API structure: { results: [...] }
        productsArray = result.results;
        console.log('✅ Found results array with', productsArray.length, 'products');
      } else if (Array.isArray(result)) {
        // Direct array response
        productsArray = result;
        console.log('✅ Found direct array with', productsArray.length, 'products');
      } else if (result.status === "coming_soon") {
        // Handle "under development" response
        throw new Error("Specifications-based search is currently under development. Please use the Make/Model search instead.");
      } else {
        console.error('❌ Unexpected API response structure:', result);
        throw new Error(result.message || 'Invalid response format from server');
      }

      if (productsArray.length === 0) {
        throw new Error('No products found for your specification criteria');
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

      console.log('✅ Specification search completed successfully!');

    } catch (err) {
      console.error('❌ Specification search error:', err);
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
      <div className="p-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-white">
            <div className="flex justify-center items-center mb-4">
              <Icon icon="carbon:model" className="text-white text-8xl m-5" />
            </div>

            <h2 className="text-xl font-bold mb-4 text-center">
              Search by Specification
            </h2>
            <p className="mb-4 text-center">
              Search for products based on detailed specifications to find
              exactly what you need.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dropdown for Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                Category
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
              <label
                htmlFor="itemName"
                className="block text-sm font-medium text-gray-700"
              >
                Item Name
              </label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter item name (e.g., Steel Bar, Cement)"
              />
            </div>

            {/* Specifications Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specifications
              </label>
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex space-x-4 mt-2">
                  <input
                    type="text"
                    name="specification_name"
                    value={spec.specification_name}
                    onChange={(e) => handleSpecificationChange(index, e)}
                    required
                    className="block w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Specification Name (e.g., Grade, Size)"
                  />
                  <input
                    type="text"
                    name="value"
                    value={spec.value}
                    onChange={(e) => handleSpecificationChange(index, e)}
                    required
                    className="block w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Value (e.g., Fe 500, 12mm)"
                  />
                  {formData.specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecification}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Specification
              </button>
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
            <p className="mt-2">Searching for products by specifications... Please wait.</p>
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
                <li>Try the Make/Model search instead</li>
                <li>Simplify your specifications</li>
              </ul>
            </div>
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <div className="mt-8 max-w-6xl mx-auto">
            <h3 className="text-3xl font-semibold mb-4 text-white text-center">
              Specification Search Results ({data.length} products found)
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
                        <span>{item["Product Name"]}</span>
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
                          {item["Product Name"]}
                        </a>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {Array.isArray(item.Specifications)
                          ? item.Specifications.join(", ")
                          : item.Specifications || 'N/A'}
                      </td>
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
                        {item["Last Updated"] || item.last_updated || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Output2;