import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function RetailerSignIn() {
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

      console.log('🔐 Attempting retailer login with:', formData.email);

      const res = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('📡 Login response:', data);

      // Check for success response
      if (!res.ok) {
        toast.error(data.message || "Login failed. Please try again.");
        dispatch(signInFailure(data));
        return;
      }

      // Check if user is a retailer (for existing users, userType might be undefined)
      if (data.user && data.user.userType && data.user.userType !== 'retailer') {
        toast.error(`This account is registered as '${data.user.userType}'. Please use the appropriate login page.`);
        dispatch(signInFailure({ message: "Not a retailer account" }));
        return;
      }

      // Successful login
      console.log('✅ Retailer login successful:', data.user);
      dispatch(signInSuccess(data));
      toast.success(data.message || "Welcome back to your retailer dashboard!");

      // Always redirect to retailer dashboard
      console.log('🏪 Redirecting to retailer dashboard');
      navigate('/retailer-dashboard');

    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error("Login failed. Please check your connection and try again.");
      dispatch(signInFailure({ message: error.message }));
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="p-5 max-w-lg w-full bg-light rounded-lg shadow-lg">
        <h1 className="text-3xl text-center font-semibold my-7 text-dark">Retailer Sign In</h1>
        
        {/* Info message */}
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
          <strong>Retailer Login:</strong> Access your dashboard to manage products and orders.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Retailer Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your retailer email"
              id="email"
              required
              className="bg-slate-100 text-dark p-3 min-w-full rounded-lg border border-middle focus:outline-none focus:ring-2 focus:ring-middle"
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
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
            className="bg-dark text-white p-3 rounded-lg uppercase hover:bg-middle transition duration-300 disabled:bg-opacity-70"
          >
            {loading ? 'Signing In...' : 'Sign In as Retailer'}
          </button>
        </form>
        
        <div className="flex justify-center gap-2 mt-5">
          <p className="text-dark">Don't have a retailer account?</p>
          <Link to="/retailer-signup">
            <span className="text-middle underline hover:text-dark">Register as Retailer</span>
          </Link>
        </div>

        <div className="flex justify-center gap-2 mt-3">
          <p className="text-sm text-gray-600">Need regular user login?</p>
          <Link to="/sign-in">
            <span className="text-sm text-middle underline hover:text-dark">Go to Regular Login</span>
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