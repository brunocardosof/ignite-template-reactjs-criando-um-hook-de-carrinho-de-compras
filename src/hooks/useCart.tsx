import { useEffect } from "react";
import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`stock/${productId}`);
      const product = await api.get(`products/${productId}`);
      const productExists = cart.find((product) => product.id === productId) || {} as Product;
      if (productExists.amount >= stock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (Object.keys(productExists).length) {
        setCart(
          cart.map((product) =>
            product.id === productId
              ? { ...product, amount: product.amount + 1 }
              : product
          )
        );
      } else {
        const newProduct = {
          ...product.data,
          amount: 1,
        };
        setCart([...cart, newProduct]);
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter((product) => product.id !== productId))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get(`stock/${productId}`);
      const product = cart.find((product) => product.id === productId) as Product;
      if (product.amount >= stock.data.amount && amount > 0) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }      
      setCart(
        cart.map((product) =>
          product.id === productId
            ? { ...product, amount: product.amount + amount }
            : product
        )
      );
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
