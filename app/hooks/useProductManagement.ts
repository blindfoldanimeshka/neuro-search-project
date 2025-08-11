import { useState, useEffect } from 'react';
import { Product, Filters } from '../components/types';

export function useProductManagement() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productQuantities, setProductQuantities] = useState<{[key: string]: number}>({});
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([]);

  // Загрузка пользовательских категорий из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCategories = localStorage.getItem('customCategories');
      const savedSubcategories = localStorage.getItem('customSubcategories');
      
      if (savedCategories) {
        setCustomCategories(JSON.parse(savedCategories));
      }
      if (savedSubcategories) {
        setCustomSubcategories(JSON.parse(savedSubcategories));
      }
    }
  }, []);

  // Сохранение пользовательских категорий в localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customCategories', JSON.stringify(customCategories));
    }
  }, [customCategories]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customSubcategories', JSON.stringify(customSubcategories));
    }
  }, [customSubcategories]);

  const addToTable = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
      setProductQuantities(prev => ({ ...prev, [product.id]: 1 }));
    }
  };

  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      setProductQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[productId];
        return newQuantities;
      });
    } else {
      setProductQuantities(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  const clearAll = () => {
    setSelectedProducts([]);
    setProductQuantities({});
    setCustomCategories([]);
    setCustomSubcategories([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedProducts');
      localStorage.removeItem('productQuantities');
      localStorage.removeItem('productFilters');
      localStorage.removeItem('customCategories');
      localStorage.removeItem('customSubcategories');
    }
  };

  return {
    selectedProducts,
    setSelectedProducts,
    productQuantities,
    setProductQuantities,
    filteredProducts,
    setFilteredProducts,
    customCategories,
    setCustomCategories,
    customSubcategories,
    setCustomSubcategories,
    addToTable,
    setQuantity,
    clearAll
  };
} 