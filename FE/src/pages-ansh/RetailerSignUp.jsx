import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';

export default function RetailerSignUp() {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(false);

      console.log('🔐 Registering retailer with:', { ...formData, userType: 'retailer' });

      // Add userType: 'retailer' to the form data
      const retailerData = { ...formData, userType: 'retailer' };

      const res = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retailerData),
      });
      
      const data = await res.json();
      console.log('📡 Registration response:', data);
      
      setLoading(false);
      
      if (res.ok && data.success) {
        console.log('✅ Registration successful, user data:', data.user);
        
        // Store user data in Redux
        dispatch(signInSuccess(data));
        
        toast.success(data.message || "Retailer registered successfully!");
        
        // Navigate directly to retailer dashboard
        console.log('🏪 Navigating to retailer dashboard');
        navigate("/retailer-dashboard"); 
        
      } else {
        console.error('❌ Registration failed:', data);
        toast.error(data.message || "Registration failed. Please try again.");
        setError(data.message || "Registration failed");
      }
    } catch (error) {
      setLoading(false);
      console.error('❌ Registration error:', error);
      toast.error("Registration failed. Please check your connection and try again.");
      setError("Network error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="p-5 max-w-lg w-full bg-light rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold my-7 text-dark">Retailer Registration</h1>
        
        {/* Info message */}
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          <strong>Join as a Retailer!</strong> Create your account to register products and manage orders.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Choose a Username *
            </label>
            <input
              type="text"
              placeholder="Enter unique username"
              id="username"
              required
              minLength="3"
              className="bg-slate-100 text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Business Email Address *
            </label>
            <input
              type="email"
              placeholder="Enter your business email"
              id="email"
              required
              className="bg-slate-100 text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Create Password *
            </label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              id="password"
              required
              minLength="6"
              className="bg-slate-100 text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          <button
            disabled={loading}
            className="bg-dark text-white p-3 rounded-lg uppercase hover:bg-middle transition duration-300 disabled:bg-opacity-70"
          >
            {loading ? 'Creating Account...' : 'Register as Retailer'}
          </button>
        </form>
        
        <div className="flex justify-center gap-2 mt-5">
          <p className="text-dark">Already have a retailer account?</p>
          <Link to="/retailer-signin">
            <span className="text-middle underline hover:text-dark">Sign In</span>
          </Link>
        </div>

        <div className="flex justify-center gap-2 mt-3">
          <p className="text-sm text-gray-600">Looking for regular signup?</p>
          <Link to="/sign-up">
            <span className="text-sm text-middle underline hover:text-dark">Regular User Signup</span>
          </Link>
        </div>

        {error && (
          <p className="text-red-700 mt-5 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}