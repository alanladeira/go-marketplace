import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
// import { Product } from 'src/pages/Cart/styles';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productStorage = await AsyncStorage.getItem(
        '@gomarketplace:product',
      );

      if (productStorage) {
        setProducts([...JSON.parse(productStorage)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const productFind = newProducts.findIndex(product => product.id === id);

      newProducts[productFind].quantity += 1;

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@gomarketplace:product',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProduct = [...products];
      const productFind = newProduct.findIndex(product => product.id === id);

      if (newProduct[productFind].quantity !== 1) {
        newProduct[productFind].quantity -= 1;

        setProducts(newProduct);
      }

      await AsyncStorage.setItem(
        '@gomarketplace:product',
        JSON.stringify(newProduct),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExist = products.find(item => item.id === product.id);

      if (productExist) {
        increment(productExist.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@gomarketplace:product',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
