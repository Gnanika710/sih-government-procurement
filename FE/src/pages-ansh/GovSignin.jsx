import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function GovSignin() {
  const [formData, setFormData] = useState({});
  const { loading, error } = useSelector((state) => state.user);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());

      console.log('🏛️ Attempting government official login with:', formData.email);

      const res = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('📡 Login response:', data);

      // ✅ FIXED: Better error handling
      if (!res.ok || data.success === false) {
        console.error('❌ Login failed:', data.message);
        toast.error(data.message || "Login failed. Please try again.");
        dispatch(signInFailure(data));
        return;
      }

      // ✅ FIXED: Check if user is a government official (optional check)
      if (data.user && data.user.userType && data.user.userType !== 'government') {
        toast.error(`This account is registered as '${data.user.userType}'. Please use the appropriate login page.`);
        dispatch(signInFailure({ message: "Not a government account" }));
        return;
      }

      // Successful login
      console.log('✅ Government official login successful:', data.user);
      dispatch(signInSuccess(data));
      toast.success(data.message || "Welcome back to your government dashboard!");

      // ✅ FIXED: Navigate to correct dashboard route
      navigate('/gov-dashboard');

    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error("Login failed. Please check your connection and try again.");
      dispatch(signInFailure({ message: error.message }));
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="p-6 max-w-md w-full bg-light rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold mb-7 text-dark">
          Government Officials Sign In
        </h1>
        
        {/* Info message */}
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
          <strong>Government Login:</strong> Access your official procurement dashboard.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Enter Your Official Email
            </label>
            <input
              type="email"
              placeholder="your.name@gov.in or official email"
              id="email"
              required
              className="bg-slate-100 text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Enter Your Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              id="password"
              required
              className="bg-slate-100 text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          
          <button
            disabled={loading}
            className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:bg-slate-600 transition duration-300 disabled:bg-opacity-70"
          >
            {loading ? 'Signing In...' : 'Sign In as Government Official'}
          </button>
        </form>
        
        <div className="flex gap-2 mt-5 justify-center">
          <p className="text-dark">Don't have an account?</p>
          <Link to="/govOfficial-signup">
            <span className="text-blue-500 underline hover:text-blue-700">Sign up</span>
          </Link>
        </div>

        {error && (
          <p className="text-red-700 mt-5 text-center">
            {error.message || 'Something went wrong!'}
          </p>
        )}
      </div>
    </div>
  );
}