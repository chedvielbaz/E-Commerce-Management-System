import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Cart = () => {
  const cartItems = useSelector((state) => state.cart.items);

  const handleRemoveItem = (itemId) => {
    // Dispatch action to remove item from cart
  };

  return (
    <div className="cart">
      <h1>Your Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty. <Link to="/">Continue Shopping</Link></p>
      ) : (
        <ul>
          {cartItems.map((item) => (
            <li key={item.id}>
              <h2>{item.name}</h2>
              <p>Price: ${item.price}</p>
              <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Cart;