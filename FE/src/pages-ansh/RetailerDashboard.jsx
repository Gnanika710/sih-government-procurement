import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import Footer from '../components-ansh/Footer';
import Navbar from '../components-ansh/Navbar';

export default function RetailerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    console.log('RetailerDashboard - Current User:', currentUser);
    
    if (!currentUser) {
      console.log('❌ No user in dashboard, redirecting to signin');
      toast.error('Please log in to access the retailer dashboard');
      navigate('/retailer-signin');
    }
  }, [currentUser, navigate]);

  const handleNavigation = (path) => {
    console.log('🔄 Navigating to:', path);
    navigate(path);
  };

  // Show loading if user data is being fetched
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-light">
      <Navbar />
      <div className="p-5 max-w-6xl mb-20 mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-4 mt-20">Retailer Dashboard</h1>
          <p className="text-lg">Welcome back, {currentUser.username}!</p>
          {currentUser.userType && (
            <p className="text-sm text-gray-300">Account Type: {currentUser.userType}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-6">
          {/* Register Product Card */}
          <div className="bg-light text-dark rounded-lg shadow-lg p-5 flex-1 min-w-[300px] flex flex-col items-center">
            <div className="flex justify-center items-center mb-4">
              <Icon icon="mdi:package-variant" className="text-dark text-8xl" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-center">Register Your Product</h2>
            <p className="mb-4 text-center">Register new products to make them available for government procurement.</p>
            <div className="flex justify-center mt-auto">
              <button 
                onClick={() => handleNavigation('/create-product')}
                className="bg-dark text-light p-3 rounded-lg uppercase hover:bg-middle transition duration-300"
              >
                Register your products
              </button>
            </div>
          </div>

          {/* Order Section Card */}
          <div className="bg-light text-dark rounded-lg shadow-lg p-5 flex-1 min-w-[300px] flex flex-col items-center">
            <div className="flex justify-center items-center mb-4">
              <Icon icon="mdi:order-bool-ascending" className="text-dark text-8xl" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-center">Order Section</h2>
            <p className="mb-4 text-center">Manage your orders and track their status effectively.</p>
            <div className="flex justify-center mt-auto">
              <button
                onClick={() => handleNavigation('/order-section')}
                className="bg-dark text-light p-3 rounded-lg uppercase hover:bg-middle transition duration-300"
              >
                Go to Orders
              </button>
            </div>
          </div>

          {/* Profile/Settings Card */}
          <div className="bg-light text-dark rounded-lg shadow-lg p-5 flex-1 min-w-[300px] flex flex-col items-center">
            <div className="flex justify-center items-center mb-4">
              <Icon icon="mdi:account-settings" className="text-dark text-8xl" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-center">Profile Settings</h2>
            <p className="mb-4 text-center">Update your profile information and account settings.</p>
            <div className="flex justify-center mt-auto">
              <button
                onClick={() => handleNavigation('/profile')}
                className="bg-dark text-light p-3 rounded-lg uppercase hover:bg-middle transition duration-300"
              >
                Manage Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}