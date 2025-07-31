import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const CreateProduct = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [userShop, setUserShop] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    shopId: "",
    description: "",
    category: "",
    tags: "",
    originalPrice: "",
    discountPrice: ""
  });

  useEffect(() => {
    if (currentUser) {
      fetchUserShop();
    }
    if (productId) {
      fetchProductDetails();
    }
  }, [currentUser, productId]);

  const fetchUserShop = async () => {
    try {
      if (!currentUser?._id) {
        toast.error("Please log in first");
        navigate('/retailer-signin');
        return;
      }

      console.log('🏪 Fetching shop for user:', currentUser._id);
      const response = await fetch(`http://localhost:3000/api/shop/get-shop-info/${currentUser._id}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Shop found:', data.shop);
        setUserShop(data.shop);
        setFormData(prev => ({
          ...prev,
          shopId: data.shop._id
        }));
      } else {
        console.log('❌ No shop found for user');
        toast.error("You don't have a shop yet. Please create a shop first.");
        navigate('/create-shop');
      }
    } catch (error) {
      console.error('Shop fetch error:', error);
      toast.error("Error fetching shop information. Please create a shop first.");
      navigate('/create-shop');
    }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/product/get-product/${productId}`);
      
      const data = await response.json();
      if (response.ok) {
        setFormData({
          name: data.product.name || "",
          shopId: data.product.shopId || "",
          description: data.product.description || "",
          category: data.product.category || "",
          tags: data.product.tags || "",
          originalPrice: data.product.originalPrice || "",
          discountPrice: data.product.discountPrice || ""
        });
      } else {
        toast.error(data.message || "Failed to fetch product details.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("An error occurred while fetching product details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (!formData.shopId.trim()) {
      toast.error("Shop ID is required. Please create a shop first.");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("Product description is required");
      return false;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return false;
    }
    if (!formData.discountPrice) {
      toast.error("Selling price is required");
      return false;
    }
    if (formData.originalPrice && parseFloat(formData.discountPrice) > parseFloat(formData.originalPrice)) {
      toast.error("Selling price cannot be higher than original price");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        shopId: formData.shopId.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags.trim(),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        discountPrice: parseFloat(formData.discountPrice)
      };

      console.log('📦 Submitting product:', payload);

      const url = productId
        ? `http://localhost:3000/api/product/update-product/${productId}`
        : "http://localhost:3000/api/product/create-product";

      const response = await fetch(url, {
        method: productId ? "PUT" : "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📡 Response:', data);

      if (response.ok) {
        toast.success(productId ? "Product updated successfully!" : "Product created successfully!");
        navigate("/retailer-dashboard");
      } else {
        toast.error(data.message || (productId ? "Failed to update product." : "Failed to create product."));
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An error occurred while processing the product.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && productId) {
    return (
      <div className="flex bg-dark justify-center items-center min-h-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-dark justify-center items-center min-h-screen py-8">
      <div className="w-full max-w-2xl bg-slate-100 shadow-lg rounded-lg p-8 m-4">
        <h5 className="text-2xl font-bold text-center text-[#353A5F] mb-8">
          {productId ? "Update Product" : "Create Product"}
        </h5>

        {/* Shop Info Display */}
        {userShop && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h6 className="font-semibold text-green-800">Creating product for:</h6>
            <p className="text-green-700">{userShop.name}</p>
            <p className="text-sm text-green-600">Shop ID: {userShop._id}</p>
          </div>
        )}

        {!userShop && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">⚠️ No shop found. You need to create a shop first.</p>
            <button
              onClick={() => navigate('/create-shop')}
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Create Shop First
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#353A5F]">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7DA0CA] focus:border-[#7DA0CA]"
              onChange={handleChange}
              placeholder="Enter your product name..."
              required
            />
          </div>

          {/* Shop ID - Auto-filled and read-only */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#353A5F]">
              Shop ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="shopId"
              value={formData.shopId}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm bg-gray-100 focus:outline-none"
              readOnly
              placeholder="Shop ID will be auto-filled..."
            />
            {formData.shopId && (
              <p className="text-xs text-gray-600">✅ Shop ID automatically detected</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#353A5F]">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7DA0CA] focus:border-[#7DA0CA]"
              onChange={handleChange}
              placeholder="Enter your product description..."
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#353A5F]">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#7DA0CA] focus:border-[#7DA0CA]"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Choose a category</option>
              <option value="Electronics">Electronics</option>
              <option value="Medical">Medical</option>
              <option value="Construction">Construction</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Clothing">Clothing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#353A5F]">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7DA0CA] focus:border-[#7DA0CA]"
              onChange={handleChange}
              placeholder="Enter tags separated by commas..."
            />
          </div>

          {/* Pricing Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Price */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#353A5F]">
                Original Price (₹)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7DA0CA] focus:border-[#7DA0CA]"
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#353A5F]">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discountPrice"
                value={formData.discountPrice}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7DA0CA] focus:border-[#7DA0CA]"
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !formData.shopId}
              className={`w-full py-3 px-4 rounded-md font-medium text-white transition duration-200 ${
                loading || !formData.shopId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#353A5F] hover:bg-[#7DA0CA] focus:outline-none focus:ring-2 focus:ring-[#7DA0CA] focus:ring-offset-2'
              }`}
            >
              {loading 
                ? (productId ? 'Updating...' : 'Creating...') 
                : (productId ? 'Update Product' : 'Create Product')
              }
            </button>
          </div>
        </form>

        {/* Back Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate('/retailer-dashboard')}
            className="text-[#7DA0CA] hover:text-[#353A5F] font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;