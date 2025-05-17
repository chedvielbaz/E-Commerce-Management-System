import React from 'react';

const ProductList = () => {
  const products = [
    { id: 1, name: 'Product 1', price: 29.99 },
    { id: 2, name: 'Product 2', price: 39.99 },
    { id: 3, name: 'Product 3', price: 49.99 },
    { id: 4, name: 'Product 4', price: 59.99 },
  ];

  return (
    <div className="product-list">
      <h1>Product List</h1>
      <div className="products">
        {products.map(product => (
          <div key={product.id} className="product">
            <h2>{product.name}</h2>
            <p>Price: ${product.price.toFixed(2)}</p>
            <button>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;