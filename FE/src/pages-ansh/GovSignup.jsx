import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { toast } from "react-toastify";

export default function GovSignup() {
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
      setLoading(true); // ✅ FIXED: Was setLoading(false)
      setError(false);

      console.log('🏛️ Registering government official with:', { ...formData, userType: 'government' });

      // ✅ FIXED: Add userType for government registration
      const govData = { ...formData, userType: 'government' };

      const res = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(govData),
      });

      const data = await res.json();
      console.log('📡 Registration response:', data);

      setLoading(false);

      if (res.ok && data.success) {
        console.log('✅ Government official registration successful');
        
        // ✅ FIXED: Store user data in Redux
        dispatch(signInSuccess(data));
        
        toast.success(data.message || "Government official registered successfully!");
        navigate("/gov-dashboard"); // ✅ FIXED: Correct route name
      } else {
        console.error('❌ Registration failed:', data);
        // ✅ FIXED: Show specific error message from server
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
      <div className="p-5 max-w-md w-full bg-light rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold my-7 text-dark">
          Government Official Sign Up
        </h1>
        
        {/* Info message */}
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
          <strong>Government Registration:</strong> Create your official account to access procurement tools.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Enter Your Username *
            </label>
            <input
              type="text"
              placeholder="Choose a unique username"
              id="username"
              required
              minLength="3"
              className="bg-white text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Enter Your Official Email *
            </label>
            <input
              type="email"
              placeholder="your.name@gov.in or official email"
              id="email"
              required
              className="bg-white text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Enter Your Password *
            </label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              id="password"
              required
              minLength="6"
              className="bg-white text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          
          <button
            disabled={loading}
            className="bg-dark text-white p-3 rounded-lg uppercase hover:bg-middle transition duration-300 disabled:bg-opacity-70"
          >
            {loading ? 'Creating Account...' : 'Sign Up as Government Official'}
          </button>
        </form>
        
        <div className="flex justify-center gap-2 mt-5">
          <p className="text-dark">Already have an account?</p>
          <Link to="/govOfficial-signin">
            <span className="text-middle underline hover:text-dark">Sign In</span>
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