import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from './pages-ansh/Home';
import About from './pages-ansh/About';
import Profile from './pages-ansh/Profile';
import RetailerSignUp from './pages-ansh/RetailerSignUp';
import RetailerSignIn from './pages-ansh/RetailerSignIn';
import RetailerDashboard from './pages-ansh/RetailerDashboard';
import GovSignin from './pages-ansh/GovSignin';
import GovSignup from './pages-ansh/GovSignup';
import GovDashboard from './pages-ansh/GovDashboard';
import Orders from './pages-ansh/Orders';
import ShopCreate from './pages-ansh/ShopCreate';
import Output from './pages-deep/Output';
import Output2 from './pages-deep/Output2';
import Output3 from './pages-deep/Output3';
import Output4 from './pages-deep/Output4';

// Components
import Header from './components-ansh/Header';
import PrivateRoute from './components-ansh/PrivateRoute';
import RetailerProtectedRoute from './components-ansh/sellerProtectedRoutes';
import CreateProduct from './components-ansh/CreateProduct';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        
        {/* Auth Routes */}
        <Route path='/retailer-signup' element={<RetailerSignUp />} />
        <Route path='/retailer-signin' element={<RetailerSignIn />} />
        <Route path='/govOfficial-signin' element={<GovSignin />} />
        <Route path='/govOfficial-signup' element={<GovSignup />} />

        {/* Search/Output Routes */}
        <Route path='/output' element={<Output />} />
        <Route path='/output2' element={<Output2 />} />
        <Route path='/output3' element={<Output3 />} />
        <Route path='/output4' element={<Output4 />} />

        {/* Protected Routes for Regular Users */}
        <Route element={<PrivateRoute />}>
          <Route path='/profile' element={<Profile />} />
        </Route>

        {/* Protected Routes for Retailers */}
        <Route path='/retailer-dashboard' element={
          <RetailerProtectedRoute>
            <RetailerDashboard />
          </RetailerProtectedRoute>
        } />
        
        <Route path='/create-product' element={
          <RetailerProtectedRoute>
            <CreateProduct />
          </RetailerProtectedRoute>
        } />
        
        <Route path='/create-shop' element={
          <RetailerProtectedRoute>
            <ShopCreate />
          </RetailerProtectedRoute>
        } />
        
        <Route path='/order-section' element={
          <RetailerProtectedRoute>
            <Orders />
          </RetailerProtectedRoute>
        } />

        {/* Government Routes */}
        <Route path='/gov-dashboard' element={<GovDashboard />} />
      </Routes>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}
import DebugAuth from './components-ansh/DebugAuth';

// Add this route in your Routes section
<Route path='/debug-auth' element={<DebugAuth />} />