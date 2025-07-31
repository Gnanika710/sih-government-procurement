import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const RetailerProtectedRoute = ({ children }) => {
  const { currentUser } = useSelector((state) => state.user);

  console.log('RetailerProtectedRoute - Current User:', currentUser);

  // Check if user is logged in
  if (!currentUser) {
    console.log('❌ No user found, redirecting to retailer signin');
    return <Navigate to="/retailer-signin" replace />;
  }

  // Check if user is a retailer (if userType exists)
  if (currentUser.userType && currentUser.userType !== 'retailer') {
    console.log('❌ User is not a retailer, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Retailer authenticated, rendering children');
  return children;
};

export default RetailerProtectedRoute;