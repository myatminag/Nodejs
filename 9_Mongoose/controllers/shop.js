const Product = require('../models/products');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    Product
        .find()
        .then((products) => {
            console.log(products);
            res.render('shop/product-list', {
                prods: products, 
                pageTitle: 'All Products', 
                path: '/products', 
            });
        }).catch((err) => {
            console.log(err);
        });
};

exports.getProduct = (req, res, next) => {
    const proId = req.params.productId;
    Product
        .findById(proId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products'
            });
        })
        .catch(err => console.log(err)); 
};

exports.getIndex = (req, res, next) => {
    Product
        .find()
        .then((products) => {
            res.render('shop/index', {
                prods: products, 
                pageTitle: 'Shop', 
                path: '/', 
            });
        })
        .catch((err) => {
            console.log(err)
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items;
            res.render('shop/cart', {
                pageTitle: 'Your Cart',
                path: '/cart',
                products: products
            });
        }).catch((err) => {
            console.log(err);
        })
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product
        .findById(prodId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then((result) => {
            console.log(result);
            res.redirect('/cart');
        })
  
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
        .deleteFromCart(prodId)
        .then((result) => {
            res.redirect('/cart');
        })
        .catch((err) => {
            console.log(err);
        })
};
     
exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items.map((item) => {
                return {
                    quantity: item.quantity,
                    product: { ...item.productId._doc }
                }
            })
            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(() => {
            return req.user.clearCart()
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch((err) => {
            console.log(err)
        })
};

exports.getOrders = (req, res, next) => {
    Order
        .find({ 'user.userId': req.user._id })
        .then((orders) => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders
            });
        })
        .catch((err) => {
            console.log(err)
        });
};