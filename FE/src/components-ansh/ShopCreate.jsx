import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ShopCreate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  
  console.log('Current User from Redux:', currentUser); // Debug log

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    zipCode: '',
    website: '',
    selectedService: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is logged in and is a retailer
  useEffect(() => {
    console.log('Shop Create - User Effect:', currentUser);
    
    if (!currentUser) {
      toast.error('Please log in first');
      navigate('/retailer-signin');
      return;
    }

    if (currentUser.userType !== 'retailer') {
      toast.error('Only retailers can create shops');
      navigate('/');
      return;
    }

    if (currentUser.isShopCreated) {
      toast.info('You already have a shop');
      navigate('/retailer-dashboard');
      return;
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('socialMedia.')) {
      const socialField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Shop name is required');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Shop address is required');
      return false;
    }
    if (!formData.zipCode.trim()) {
      setError('Zip code is required');
      return false;
    }
    if (!formData.selectedService) {
      setError('Please select a service');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!currentUser || !currentUser._id) {
      setError('User not found. Please log in again.');
      toast.error('Please log in again');
      navigate('/retailer-signin');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting shop data:', formData);
      console.log('User ID:', currentUser._id);

      const shopData = {
        ...formData,
        userId: currentUser._id, // Use the correct user ID from Redux
      };

      const response = await fetch('http://localhost:3000/api/shop/create-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopData),
      });

      const data = await response.json();
      console.log('Shop creation response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create shop');
      }

      if (data.success) {
        toast.success(data.message || 'Shop created successfully!');
        
        // Update user state to reflect shop creation
        // You might want to dispatch an action to update the user state here
        
        // Navigate to retailer dashboard
        navigate('/retailer-dashboard');
      } else {
        throw new Error(data.message || 'Failed to create shop');
      }

    } catch (error) {
      console.error('Shop creation error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading if user data is not yet available
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Register your Shop
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Shop Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your shop name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+91-80-12345678"
            />
          </div>

          {/* Shop Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Shop Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your complete shop address"
            />
          </div>

          {/* Zip Code */}
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
              Zip Code *
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="560001"
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://yourshop.com"
            />
          </div>

          {/* Service Selection */}
          <div>
            <label htmlFor="selectedService" className="block text-sm font-medium text-gray-700 mb-2">
              Choose a Service *
            </label>
            <select
              id="selectedService"
              name="selectedService"
              value={formData.selectedService}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a service</option>
              <option value="Electronics Retailer">Electronics Retailer</option>
              <option value="Food Retailer">Food Retailer</option>
              <option value="Clothing Retailer">Clothing Retailer</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Sports & Fitness">Sports & Fitness</option>
              <option value="Books & Media">Books & Media</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Social Media Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Social Media Links
            </label>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="facebook" className="block text-sm text-gray-600 mb-1">
                  Facebook
                </label>
                <input
                  type="url"
                  id="facebook"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://facebook.com/yourshop"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm text-gray-600 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  id="instagram"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://instagram.com/yourshop"
                />
              </div>

              <div>
                <label htmlFor="twitter" className="block text-sm text-gray-600 mb-1">
                  Twitter
                </label>
                <input
                  type="url"
                  id="twitter"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://twitter.com/yourshop"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            } transition duration-200`}
          >
            {loading ? 'Creating Shop...' : 'Create Shop'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have a shop?{' '}
            <button
              onClick={() => navigate('/retailer-dashboard')}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Go to Dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopCreate;