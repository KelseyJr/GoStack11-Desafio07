import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const ASYNC_STORAGE = '@Products:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const product = await AsyncStorage.getItem(ASYNC_STORAGE);

      if (product) {
        setProducts(JSON.parse(product));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const checkIfProductWasAdded = products.find(
        product => product.id === id,
      );

      if (!checkIfProductWasAdded) {
        throw new Error('Produto não encontrado :(');
      }

      const newListProducts = products.map((product: Product) => {
        if (product.id === checkIfProductWasAdded.id) {
          product.quantity += 1;
        }
        return product;
      });
      setProducts(newListProducts);

      await AsyncStorage.setItem(
        ASYNC_STORAGE,
        JSON.stringify(newListProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const checkIfProductWasAdded = products.find(
        product => product.id === id,
      );

      if (!checkIfProductWasAdded) {
        throw new Error('Produto não encontrado :(');
      }

      const newListProducts = products.map((product: Product) => {
        if (product.id === id) {
          product.quantity -= 1;
        }
        return product.quantity > 0 ? product : ({} as Product);
      });

      setProducts(newListProducts);

      await AsyncStorage.setItem(
        ASYNC_STORAGE,
        JSON.stringify(newListProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productInCart = products.find(cart => cart.id === product.id);

      if (productInCart) {
        increment(productInCart.id);
        return;
      }

      product.quantity = 1;
      products.push(product);
      setProducts([...products]);

      await AsyncStorage.setItem(ASYNC_STORAGE, JSON.stringify(products));
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
