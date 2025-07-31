import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';

export default function PrivateRoute() {
  const { currentUser } = useSelector(state => state.user);
  
  console.log('PrivateRoute - Current User:', currentUser);
  
  // If user is not authenticated, redirect to sign-in
  return currentUser ? <Outlet /> : <Navigate to="/sign-in" replace />;
}