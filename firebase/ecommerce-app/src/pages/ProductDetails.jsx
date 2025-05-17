import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetails = () => {
  const { id } = useParams();
  
  // Placeholder for product data
  const product = {
    id: id,
    name: "Sample Product",
    description: "This is a detailed description of the sample product.",
    price: 29.99,
    imageUrl: "https://via.placeholder.com/150"
  };

  return (
    <div className="product-details">
      <h1>{product.name}</h1>
      <img src={product.imageUrl} alt={product.name} />
      <p>{product.description}</p>
      <h2>${product.price.toFixed(2)}</h2>
      <button>Add to Cart</button>
    </div>
  );
};

export default ProductDetails;