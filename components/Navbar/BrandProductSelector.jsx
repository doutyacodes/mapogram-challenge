import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Package, Tag } from 'lucide-react';

const BrandProductSelector = ({ onSelectionChange }) => {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [expandedBrands, setExpandedBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrands.length > 0) {
      fetchProducts(selectedBrands);
    } else {
      setProducts([]);
      setSelectedProducts([]);
    }
  }, [selectedBrands]);

  useEffect(() => {
    onSelectionChange({
      brands: selectedBrands,
      products: selectedProducts
    });
  }, [selectedBrands, selectedProducts]);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands');
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (brandIds) => {
    try {
      const allProducts = await Promise.all(
        brandIds.map(async (brandId) => {
          const response = await fetch(`/api/products?brandId=${brandId}`);
          const data = await response.json();
          return {
            brandId,
            products: data.products || []
          };
        })
      );
      
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const toggleBrand = (brandId) => {
    setSelectedBrands(prev => {
      if (prev.includes(brandId)) {
        // Remove brand and its products
        const newBrands = prev.filter(id => id !== brandId);
        setSelectedProducts(prevProducts => 
          prevProducts.filter(productId => {
            const product = products
              .find(p => p.brandId === brandId)
              ?.products.find(prod => prod.id === productId);
            return !product;
          })
        );
        return newBrands;
      } else {
        return [...prev, brandId];
      }
    });
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const toggleBrandExpansion = (brandId) => {
    setExpandedBrands(prev => {
      if (prev.includes(brandId)) {
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
  };

  const getBrandProducts = (brandId) => {
    const brandProducts = products.find(p => p.brandId === brandId);
    return brandProducts?.products || [];
  };

  const getSelectedProductsForBrand = (brandId) => {
    const brandProducts = getBrandProducts(brandId);
    return selectedProducts.filter(productId => 
      brandProducts.some(p => p.id === productId)
    ).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <Package className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Select Brands & Products</h3>
            <p className="text-sm text-blue-700">
              Choose the brands you service. After selecting a brand, you can specify which products you handle.
            </p>
          </div>
        </div>
      </div>

      {/* Brands Selection */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Tag className="w-4 h-4 mr-2" />
          Brands ({selectedBrands.length} selected)
        </h4>
        
        <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
          {brands.map((brand) => {
            const isSelected = selectedBrands.includes(brand.id);
            const isExpanded = expandedBrands.includes(brand.id);
            const brandProducts = getBrandProducts(brand.id);
            const selectedCount = getSelectedProductsForBrand(brand.id);

            return (
              <div key={brand.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Brand Header */}
                <div className="flex items-center p-3 hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => toggleBrand(brand.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{brand.name}</div>
                    {brand.description && (
                      <div className="text-xs text-gray-500 truncate">{brand.description}</div>
                    )}
                    {isSelected && selectedCount > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>

                  {isSelected && brandProducts.length > 0 && (
                    <button
                      onClick={() => toggleBrandExpansion(brand.id)}
                      className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  )}
                </div>

                {/* Products List */}
                {isSelected && isExpanded && brandProducts.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      Products for {brand.name}
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {brandProducts.map((product) => {
                        const isProductSelected = selectedProducts.includes(product.id);
                        return (
                          <label
                            key={product.id}
                            className="flex items-start p-2 hover:bg-white rounded cursor-pointer transition-colors"
                          >
                            <button
                              onClick={() => toggleProduct(product.id)}
                              className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center mr-2 mt-0.5 transition-colors ${
                                isProductSelected 
                                  ? 'bg-green-600 border-green-600' 
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {isProductSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900">{product.name}</div>
                              {product.category && (
                                <div className="text-xs text-gray-500">{product.category}</div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isSelected && isExpanded && brandProducts.length === 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 text-center">
                    No products available for this brand
                  </div>
                )}
              </div>
            );
          })}

          {brands.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No brands available
            </div>
          )}
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedBrands.length > 0 || selectedProducts.length > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm">
            <span className="font-semibold text-green-900">Selected: </span>
            <span className="text-green-700">
              {selectedBrands.length} brand{selectedBrands.length !== 1 ? 's' : ''}
              {selectedProducts.length > 0 && (
                <> and {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}</>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandProductSelector;