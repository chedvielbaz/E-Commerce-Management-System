# e-Commerce Web Application

This is a simple e-commerce web application built using React and Redux. The application features user authentication with login and registration pages, product listings, and a shopping cart.

## Features

- User authentication (login and registration)
- Product listing and details
- Shopping cart functionality
- Responsive design

## Technologies Used

- React
- Redux
- Firebase (for authentication and database)
- CSS for styling

## Project Structure

```
ecommerce-app
├── public
│   ├── index.html
│   └── favicon.ico
├── src
│   ├── components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Navbar.jsx
│   ├── pages
│   │   ├── Home.jsx
│   │   ├── ProductList.jsx
│   │   ├── ProductDetails.jsx
│   │   └── Cart.jsx
│   ├── redux
│   │   ├── store.js
│   │   ├── slices
│   │   │   ├── authSlice.js
│   │   │   └── cartSlice.js
│   ├── styles
│   │   ├── Login.css
│   │   ├── Register.css
│   │   ├── Navbar.css
│   │   └── Global.css
│   ├── App.jsx
│   ├── index.jsx
│   └── firebase
│       └── firebaseConfig.js
├── package.json
├── .gitignore
└── README.md
```

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd ecommerce-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm start
   ```

## Contributing

Feel free to submit issues or pull requests for any improvements or features you would like to see in the application.

## License

This project is licensed under the MIT License.