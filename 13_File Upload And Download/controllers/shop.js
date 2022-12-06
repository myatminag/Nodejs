const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
                path: '/products',
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }); 
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
                products: products,
            });
        }).catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
                    email: req.user.email,
                    userId: req.user,
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.getOrders = (req, res, next) => {
    Order
        .find({ 'user.userId': req.user._id })
        .then((orders) => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order
        .findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No Order Found!'))
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('NOT Authorized!'));
            }
            const invoiceName = 'invoice-' +  orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument(); 

            res.setHeader('Content-Type', 'application/pdf');  
            res.setHeader('Content-Disposition', 'attachment; filename="" ' + invoiceName + "")

            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            });
            pdfDoc.text('-----------------------');
            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += totalPrice + prod.quantity * prod.product.price;
                pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price)
            });
            pdfDoc.text('-----------------------')
            pdfDoc.fontSize(20).text('Total Price: $' + totalPrice)

            pdfDoc.end();
            // For Smaller Size It's Okay But Not For Bigger Size
            // fs.readFile(invoicePath, (err, data) => {
            //     if (err) {
            //         return next(err);
            //     }
            //     res.setHeader('Content-Type', 'application/pdf');  
            //     res.setHeader('Content-Disposition', 'attachment; filename="" ' + invoiceName + "")
            //     res.send(data);
            // });
            // For Bigger Size
            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf');  
            // res.setHeader('Content-Disposition', 'attachment; filename="" ' + invoiceName + "")
            // file.pipe(res);
        })
        .catch(err => {
            console.log(err);
        })
}