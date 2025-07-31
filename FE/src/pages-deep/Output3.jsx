import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Footer from "../components-ansh/Footer";

const Output3 = () => {
  const [formData, setFormData] = useState({
    serviceType: "medical", // Default service type
    location: "",
    services: [{ description: "" }], // Initialize with one empty service
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topSuggestions, setTopSuggestions] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  const calculateReasonabilityScore = (rating, reviews) => {
    // Handle different rating formats
    let numericRating = 0;
    let numericReviews = 0;
    
    if (typeof rating === 'string') {
      const ratingMatch = rating.match(/(\d+\.?\d*)/);
      numericRating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    } else {
      numericRating = parseFloat(rating) || 0;
    }
    
    if (typeof reviews === 'string') {
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

  // Handle input changes for services
  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    console.log("Handling change for index:", index, "name:", name, "value:", value);

    const newServices = [...formData.services];
    newServices[index] = {
      ...newServices[index],
      [name]: value,
    };

    setFormData((prev) => ({
      ...prev,
      services: newServices,
    }));

    console.log("Updated services:", newServices);
  };

  // Add a new service field
  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { description: "" }],
    }));
  };

  // Remove a service field
  const removeService = (index) => {
    if (formData.services.length > 1) {
      const newServices = formData.services.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        services: newServices,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData([]);
    setTopSuggestions([]);
    setAverageRating(null);

    try {
      console.log('🚀 Starting service provider search with:', formData);
      
      // Filter out empty service descriptions
      const serviceDescriptions = formData.services
        .map((service) => service.description)
        .filter(desc => desc.trim() !== "");

      if (serviceDescriptions.length === 0) {
        throw new Error("Please add at least one service description");
      }

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Call the Python API for service provider search
      const response = await fetch(
        `http://127.0.0.1:8000/scrape-service-providers/${formData.serviceType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            location: formData.location,
            services: serviceDescriptions,
            service_type: formData.serviceType
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
      let providersArray = [];
      
      if (result.results && Array.isArray(result.results)) {
        providersArray = result.results;
        console.log('✅ Found results array with', providersArray.length, 'providers');
      } else if (Array.isArray(result)) {
        providersArray = result;
        console.log('✅ Found direct array with', providersArray.length, 'providers');
      } else {
        console.error('❌ Unexpected API response structure:', result);
        throw new Error(result.message || 'Invalid response format from server');
      }

      if (providersArray.length === 0) {
        throw new Error('No service providers found for your criteria');
      }

      setData(providersArray);

      // Calculate average rating
      const ratings = providersArray
        .map(provider => {
          const ratingStr = provider.rating || provider.Rating || '0';
          const numericRating = parseFloat(ratingStr.toString().replace(/[^0-9.-]+/g, ""));
          return isNaN(numericRating) ? 0 : numericRating;
        })
        .filter(rating => rating > 0);

      if (ratings.length > 0) {
        const avgRating = ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length;
        setAverageRating(avgRating.toFixed(1));
      }

      // Calculate top suggestions
      const scores = providersArray.map((provider) => ({
        ...provider,
        reasonabilityScore: calculateReasonabilityScore(
          provider.rating || provider.Rating,
          provider.reviews || provider.Reviews
        ),
      }));

      const topThree = scores
        .slice()
        .sort((a, b) => b.reasonabilityScore - a.reasonabilityScore)
        .slice(0, 3);
      setTopSuggestions(topThree);

      console.log('✅ Service provider search completed successfully!');

    } catch (err) {
      console.error('❌ Service provider search error:', err);
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
              <Icon
                icon="fluent-mdl2:service-off"
                className="text-white text-8xl m-5"
              />
            </div>

            <h2 className="text-xl font-bold mb-4 text-center">
              Search Service Provider
            </h2>
            <p className="mb-4 text-center">
              Identify and connect with service providers to meet your specific
              needs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dropdown for Service Type */}
            <div>
              <label
                htmlFor="serviceType"
                className="block text-sm font-medium text-gray-700"
              >
                Service Type
              </label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="medical">Medical</option>
                <option value="electrical">Electrical</option>
                <option value="civil">Civil Maintenance</option>
              </select>
            </div>

            {/* Input for Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your location (e.g., Bangalore, Mumbai)"
              />
            </div>

            {/* Services Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Required
              </label>
              {formData.services.map((service, index) => (
                <div key={index} className="flex space-x-4 mt-2">
                  <input
                    type="text"
                    name="description"
                    value={service.description}
                    onChange={(e) => handleServiceChange(index, e)}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Service Description (e.g., Emergency Surgery, AC Repair)"
                  />
                  {formData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addService}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Service
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
            <p className="mt-2">Searching for service providers... Please wait.</p>
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
                <li>Check your location spelling</li>
                <li>Try different service descriptions</li>
                <li>Ensure you have at least one service description</li>
              </ul>
            </div>
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <div className="mt-8 max-w-6xl mx-auto">
            <h3 className="text-3xl font-semibold mb-4 text-white text-center">
              Service Provider Results ({data.length} providers found)
            </h3>

            {/* Display Average Rating */}
            {averageRating && (
              <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
                <p><strong>Average Provider Rating:</strong> {averageRating}/5.0</p>
              </div>
            )}

            {/* Top Suggestions */}
            {topSuggestions.length > 0 && (
              <div className="mt-8 p-4 bg-blue-100 text-blue-800 rounded-md mb-10">
                <h3 className="text-xl font-semibold mb-4">🏆 Top Recommended Providers</h3>
                <ul className="space-y-2">
                  {topSuggestions.map((provider, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <a
                        href={provider.website || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        <span>{provider.service_provider || provider['Service Provider']}</span>
                      </a>
                      <span className="bg-blue-200 px-2 py-1 rounded">
                        Score: {provider.reasonabilityScore.toFixed(1)}
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
                    <th className="py-2 px-4 border-b font-semibold text-left">Service Provider</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Specialization</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Contact No.</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Rating</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Reviews</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Location</th>
                    <th className="py-2 px-4 border-b font-semibold text-left">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b">
                        <a
                          href={item.website || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {item.service_provider || item['Service Provider']}
                        </a>
                      </td>
                      <td className="py-2 px-4 border-b">{item.specialization || item.Specialization}</td>
                      <td className="py-2 px-4 border-b">{item.phone || item['Contact No.']}</td>
                      <td className="py-2 px-4 border-b">{item.rating || item.Rating}</td>
                      <td className="py-2 px-4 border-b">{item.reviews || item.Reviews}</td>
                      <td className="py-2 px-4 border-b">{item.location || item.Location}</td>
                      <td className="py-2 px-4 border-b">
                        <span className="bg-gray-200 px-2 py-1 rounded text-sm">
                          {calculateReasonabilityScore(
                            item.rating || item.Rating, 
                            item.reviews || item.Reviews
                          ).toFixed(1)}
                        </span>
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

export default Output3;