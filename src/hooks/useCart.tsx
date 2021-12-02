import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
		const storagedCart = localStorage.getItem('@RocketShoes:cart');

		if (storagedCart) {
		   return JSON.parse(storagedCart);
		}
		console.log("Iniciando... Nada encontrado no carrinho")
		return[];
	});

	const addProduct = async (productId: number) => {
		try {

			const isProductInCart = cart.find(product => product.id === productId ) 
					
			if (isProductInCart === undefined) {
				console.log("Produto ainda não está no carrinho. Requisitando servidor...")

				let productsResponse = await api.get("/products")	
				let selectedProduct = productsResponse.data.find( (product:Product) => ( 
					product.id === productId
				))

				let newCartItem = {...selectedProduct, amount: 1};
				let newListOfCartItens = [...cart, newCartItem];
				
				setCart(newListOfCartItens);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newListOfCartItens))
				
				console.log("Carrinho atualizado com sucesso!!")
				console.log("--------------------------------")
					
			}
			else {
				console.log("Produto encontrado:  verificando disponibilidade no estoque")

				const stockResponse = await api.get("/stock")
				let stockProduct = stockResponse.data.find((item:Stock) => item.id === productId );
				let cartProductIndex = cart.findIndex((cartItem: Product) => cartItem.id === productId)

				console.log("id: " + stockProduct.id + " total no stock: " + stockProduct.amount);
				console.log(stockResponse.data)

				if(cart[cartProductIndex].amount < stockProduct.amount) {
					let newCart = [...cart];
					newCart[cartProductIndex].amount += 1;
					setCart(newCart);
					localStorage.setItem('@RocketShoes:cart' ,JSON.stringify(newCart));
				}
				else{
					toast.error('Quantidade solicitada fora de estoque')
				}

				console.log("--------------------------------")
			}		
		} 
		catch(er) {
			toast.error('Erro na adição do produto')	
			console.log(er)
		}
	};

	const removeProduct = (productId: number) => {
		try {
			console.log("Removendo produto do carrinho e do local storage")

			let newCart = cart.filter((item:Product) => item.id !== productId)
			setCart(newCart)
			localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

		} catch {
			// TODO
			toast.error('Erro na remoção do produto')
		}
	};

	const updateProductAmount = async ({
		productId,
		amount,
	}: UpdateProductAmount) => {
		try {
			// TODO
			api.get("/stocks").then(response => console.log(response.data))
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
