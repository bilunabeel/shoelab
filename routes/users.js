var express = require('express');
const { response } = require('../app');
const userHelpers = require('../helpers/userHelpers');
var router = express.Router();
const bodyParser = require('body-parser');
const user = require('../models/user');
const productHelpers = require('../helpers/product-helpers');
const productData = require('../models/productData');
const { addAddress } = require('../helpers/userHelpers');
const adminHelpers = require('../helpers/adminHelpers')
const moment = require('moment')

const verifyLogin = (req, res, next) => {
  if (req.session.userDetails) {
    const userId = req.session.userDetails._id
    userHelpers.isUserBlock(userId).then((user) => {
      if (user.block != true) {
        next();

      }
    })
  } else {
    res.redirect('/user-login');
  }
};

// ---GET---

router.get('/', async (req, res) => {
  res.header(
    'Cache-control',
    'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0'
  );
  const products = await productHelpers.getProducts();
  const product = await productHelpers.getoneProduct();
  let cartCount = null;
  if (req.session.userDetails) {
    cartCount = await userHelpers.getCartCount(req.session.userDetails._id);
  }
  let user = req.session.userDetails;
  res.render('user/user-home', { products, product, cartCount, user });
});

router.get('/user-login', (req, res) => {
  res.header(
    'Cache-control',
    'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0'
  );
  if (req.session.loggedIn) {
    res.redirect('/');
  } else {
    let loginErr = req.session.loginErr;
    res.render('user/user-login', { loginErr });
    req.session.loginErr = null;
  }
});

router.post('/user-login', (req, res) => {
  userHelpers.doLogin(req.body).then(response => {
    console.log(response);
    if (response.status) {
      req.session.userDetails = response.user;
      req.session.loggedIn = true;
      res.redirect('/');
    } else {
      req.session.loginErr = 'Invalid Email or Password';
      res.redirect('/user-login');
    }
  }).catch((err) => {
    req.session.loginErr = err.msg
    res.redirect('/user-login')
  })
});

router.get('/user-signup', (req, res) => {
  res.header(
    'Cache-control',
    'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0'
  );
  if (req.session.loggedIn) {
    res.redirect('/');
  } else {
    res.render('user/user-signup', {
      signErr: req.session.signErr,
      emailexistErr: req.session.emailexistErr,
    });
    req.session.signErr = null;
    req.session.emailexistErr = null;
  }
});

router.post('/user_signup', (req, res) => {
  userHelpers
    .doSignUp(req.body)
    .then(response => {
      if (!req.body.Firstname || !req.body.Email || !req.body.Password) {
        req.session.signErr = 'Enter valid Entries';
        res.redirect('/user-signup');
      } else {
        console.log(response);
        req.session.otp = response.otp;
        req.session.userDetails = response;

        res.redirect('/otp-signup');
      }
    })
    .catch((err) => {

      req.session.emailexistErr = err.message;
      res.redirect('/user-signup');
    });
});

router.get('/otp-signup', (req, res) => {
  res.header(
    'Cache-control',
    'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0'
  );
  if (req.session.loggedIn) {
    res.redirect('/');
  } else {
    res.render('user/otp-signup', { otpErr: req.session.otpErr });
  }
});

router.post('/otpVerify', async (req, res) => {
  if (req.session.otp == req.body.otpSignup) {
    let userData = req.session.userDetails;
    const addUser = await new user({
      Firstname: userData.Firstname,
      Lastname: userData.Lastname,
      Email: userData.Email,
      Password: userData.Password,
    });
    await addUser.save();

    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    req.session.otpErr = 'Invalid OTP';
    res.redirect('/otp-signup');
  }
});

router.get('/logout', (req, res) => {
  res.header(
    'Cache-control',
    'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0'
  );
  req.session.destroy();
  res.redirect('/user-login');
});

router.get('/forgotPass', (req, res) => {
  const emailErr = req.session.emailErr;
  res.render('reset/forgotPass', { emailErr });
});

router.post('/forgotPass', (req, res) => {
  userHelpers
    .doReset(req.body)
    .then(response => {
      console.log('OTP: ' + response.otp);
      req.session.resetOtp = response.otp;
      req.session.resetEmail = response.Email;
      req.session.rId = response.rId;
      req.session.emailErr = null;
      res.redirect('/reset-otp');
    })
    .catch(err => {
      console.log("Email doesn't exist");
      req.session.emailErr = err.message;
      res.redirect('/forgotPass');
    });
});

router.get('/reset-otp', (req, res) => {
  const otpErr = req.session.otpErr;
  res.render('reset/reset-otp', { otpErr });
});

router.post('/resetOtpVerify', async (req, res) => {
  if (req.session.resetOtp == req.body.resetOtp) {
    res.redirect('/reset-password');
  } else {
    console.log(req.session.resetOtp);
    console.log(req.body.resetOtp);
    console.log('OTP is incorrect');
    req.session.otpErr = "OTP doesn't match";
    res.redirect('/reset-otp');
  }
});

router.get('/reset-password', (req, res) => {
  const conformErr = req.session.conformErr;
  res.render('reset/reset-password', { conformErr });
});

router.post('/reset-password', async (req, res) => {
  console.log(req.body);
  if (req.body.Password == req.body.cPassword) {
    userHelpers.doResetPassword(req.body, req.session.rId).then(response => {
      console.log(response);
      res.redirect('/user-login');
      console.log('Password Updated..!');
    });
  }
});

router.get('/logout', (req, res) => {
  res.header(
    'Cache-control',
    'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0'
  );
  req.session.destroy();
  res.redirect('/user-login ');
});

router.get('/category', (req, res) => {
  res.render('user/shop/category');
});

router.get('/product-details/:id', async (req, res) => {
  const product = await productHelpers.getoneProduct(req.params.id);
  console.log('--------getoneproduct request--------');
  console.log(product.id);
  const brands = await productHelpers.getBrands();
  const categories = await productHelpers.getCategories();
  const subcategories = await productHelpers.getSubcategories();
  const user = req.session.userDetails;
  res.render('user/shop/product-details', {
    product,
    user,
    brands,
    categories,
    subcategories,
  });
});

router.get('/add-to-cart/:id', (req, res) => {

  userHelpers
    .addToCart(req.params.id, req.session.userDetails)
    .then(response => {
      res.json({response });
    }).catch((error)=>{
      res.json(error)
    })
});

router.get('/cart', verifyLogin, async (req, res) => {
  const user = req.session.userDetails;
  let cartCount = await userHelpers.getCartCount(req.session.userDetails._id);
  if (cartCount > 0) {

    const subTotal = await userHelpers.subTotal(req.session.userDetails._id);
    const totalAmount = await userHelpers.totalAmount(req.session.userDetails._id);
    const netTotal = await totalAmount.grandTotal.total;
    const deliveryCharges = await userHelpers.deliveryCharge(netTotal);
    const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharges);
    const cartItems = await userHelpers.cartItems(req.session.userDetails._id);

    res.render('user/shop/cart', {
      user,
      cartItems,
      subTotal,
      netTotal,
      cartCount,
      totalAmount,
      deliveryCharges,
      grandTotal,
    });
  } else {
    let cartItem = await userHelpers.cartItems(req.session.userDetails._id);
    let cartItems = cartItem ? productData : [];
    deliveryCharges = 0
    grandTotal = 0
    cartCount = 0
    netTotal = 0
    res.render('user/shop/emptyCart', { user, deliveryCharges, grandTotal, cartCount, netTotal });
  }
});

router.post('/change-product-quantity', async (req, res) => {
  console.log('change product quantity....!');
  
  userHelpers
    .changeProductQuantity(req.body, req.session.userDetails)
    .then(async(response) => {
      const cartCount = await userHelpers.getCartCount(req.session.userDetails._id)
      if(cartCount > 0){
        const subTotal = await userHelpers.subTotal(req.session.userDetails._id)
        const totalAmount = await userHelpers.totalAmount(req.session.userDetails._id)
        const netTotal = totalAmount.grandTotal.total
        const deliveryCharges = await userHelpers.deliveryCharge(netTotal)
        const grandTotal = await userHelpers.grandTotal(netTotal,deliveryCharges)
        res.json({
          response,
          status:true,
          grandTotal,
          deliveryCharges,
          netTotal
        })
      }else{

        res.json({ response });
      }
    });
});

router.post('/remove-product-forCart', (req, res, next) => {
  userHelpers.removeFromCart(req.body, req.session.userDetails).then(() => {
    res.json({ status: true });
  });
});

router.get('/checkout', verifyLogin, async (req, res) => {
  userHelpers.cartItem(req.session.userDetails._id).then(async (response) => {
    const totalAmount = await userHelpers.totalAmount(req.session.userDetails._id);
    const addresses = await userHelpers.getAddresses(req.session.userDetails);
    const netTotal = await totalAmount.grandTotal.total;
    const deliveryCharges = await userHelpers.deliveryCharge(netTotal);
    const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharges);
    const cartItems = await userHelpers.cartItems(req.session.userDetails._id);
    const allCoupons = await adminHelpers.getAllCoupons()
    const cartCount = await userHelpers.getCartCount(req.session.userDetails._id)

    res.render('user/shop/checkout', {
      allCoupons,
      addresses,
      netTotal,
      deliveryCharges,
      cartItems,
      grandTotal,
      cartCount,
      user: req.session.userDetails,
    });
  }).catch((err) => {
    res.redirect('/')
  })
});

router.post('/place-order', async (req, res) => {
  const cartItems = await userHelpers.cartItems(req.session.userDetails._id);
  const totalAmount = await userHelpers.totalAmount(req.session.userDetails._id);
  const netTotal = await totalAmount.grandTotal.Total;
  const deliveryCharges = await userHelpers.deliveryCharge(netTotal);
  const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharges);

  userHelpers
    .placeOrder(
      req.body,
      cartItems,
      grandTotal,
      deliveryCharges,
      netTotal,
      req.session.userDetails
    ).then((response) => {
      req.session.orderId = response._id
      if (req.body['paymentMethod'] == 'Cash on Delivery') {
        console.log('paymnet cod...............');
        res.json({ CODsuccess: true })
      } else {
        userHelpers.generateRazorpay(response._id, req.body.mainTotal).then((response) => {
          res.json(response)
        })
      }
    })
});

router.post('/cancel-order',(req,res)=>{
  userHelpers.cancelOrder(req.body).then((response)=>{
    res.json({status:true})
  })
})

router.get('/order-success', verifyLogin, async (req, res) => {
  userHelpers.getOrderProducts(
    req.session.userDetails._id
  ).then(async (response) => {
    let orderProducts = response
    const user = req.session.userDetails
    cartCount = await userHelpers.getCartCount(req.session.userDetails._id)
   // const ordered_on = moment(orderProducts.ordered_on).format('MMM Do YY')
    
    res.render('user/shop/order-success', { orderProducts, cartCount,  user });
  })
});

router.get('/my-order', verifyLogin, async (req, res) => {
  console.log('lsdofhkj');
  userHelpers.getAllOrders(req.session.userDetails._id).then((response) => {
    const orders = response

    orders.forEach(element => {
      element.ordered_on = moment(element.ordered_on).format('MMM Do YY')
    });
    console.log(orders);
    res.render('user/shop/my-order', {
      user: req.session.userDetails,
      orders,
    });
  })
});

router.get('/viewOrderProducts/:id',verifyLogin, (req, res) => {
  //console.log(req.params.id);

  userHelpers.getOrderProducts(req.params.id).then(async (response) => {
    cartCount = await userHelpers.getCartCount(req.session.userDetails._id)
    const order = response
    const ordered_on = moment(order.ordered_on).format("MMM Do YY");

    res.render('user/shop/viewOrderProducts', { cartCount, ordered_on, order, user: req.session.userDetails })
  })
})

router.get('/viewOrderDetails', async (req, res) => {
  userHelpers.getOrderProducts(req.session.orderId).then((response) => {
    const orderProducts = response
    const user = req.session.userDetails

    const ordered_on = moment(orderProducts.ordered_on).format('MMM Do YY')
    console.log(ordered_on);
    //res.render('user/shop/order-success')
  })
})

router.post('/verify-payment', (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
        console.log('Payment successful');
        res.json({ status: true });
      });
    })
    .catch(err => {
      console.log('errror: ' + err);
      res.json({ status: false, errMsg: 'Payment failed' });
    });
});

router.get('/addToWish/:id', verifyLogin, (req, res) => {
  console.log('params:  ' + req.params.id);
  userHelpers
    .addToWish(req.params.id, req.session.userDetails._id)
    .then(response => {
      res.json(response);
    })
    .catch(error => {
      console.log('wishlist adding failed successfully');
      res.redirect('/user-login');
    });
});

router.get('/wishlist', verifyLogin, async (req, res) => {
  const wishlist = await userHelpers.getWishlist(req.session.userDetails);
  const user = req.session.userDetails;

  const cartCount = await userHelpers.getCartCount(
    req.session.userDetails._id
  );

  if (wishlist) {
    res.render('user/shop/wishlist', { user, wishlist, cartCount });
  }
});

router.post('/removeFromWishlist', async (req, res) => {
  const wishlist = req.body.proId;
  await userHelpers
    .removeFromWishlist(wishlist, req.session.userDetails._id)
    .then(response => {
      res.json({ status: true });
    });
});

router.get('/toCartFromWish/:id', async (req, res) => {
  userHelpers
    .addToCart(req.params.id, req.session.userDetails._id)
    .then(async response => {
      const deleteFromWish = await userHelpers.removeFromWishlist(
        req.params.id,
        req.session.userDetails._id
      );
      res.json(response);
    });
});

router.get('/address', async (req, res) => {
  const user = req.session.userDetails;
  const cartCount = await userHelpers.getCartCount(user._id);
  const addresses = await userHelpers.getAddresses(user);
  res.render('user/shop/address', { addresses, user, cartCount });
});

router.get('/add-address', (req, res) => {
  res.render('user/shop/add-address', { user: req.session.userDetails });
});

router.post('/add-address/:id', async (req, res) => {
  console.log(req.params.id);
  userHelpers.addAddress(req.params.id, req.body).then(response => {
    res.redirect('/address');
  });
});

router.get('/edit-address/:id',verifyLogin, async(req, res) => {
  console.log(req.params.id);
  const user = req.session.userDetails;
  const address =await userHelpers.getAddress(req.params.id, user._id)

  res.render('user/shop/edit-address',{address});
});

router.post('/edit-address/:id',(req,res)=>{
  
})

router.post('/delete-address', async (req, res) => {
  const address = req.body.addressId;
  const user = req.session.userDetails;
  await userHelpers.deleteAddress(address, user._id).then(response => {
    res.json({ status: true });
  });
});

router.get('/profile', (req, res) => {
  res.render('user/profile', { user: req.session.userDetails });
});

router.get('/edit-profile', (req, res) => {
  res.render('user/edit-profile', { user: req.session.userDetails })
})

router.post('edit-profile', async (req, res) => {
  await userHelpers.editProfile(req.body, req.session.userDetails._id).then(() => {
    res.redirect('/user/profile')
  })
})

router.post('/apply-coupon', (req, res) => {

  deliveryCharges = parseInt(req.body.deliveryCharges)
  //let todayDate = new DataTransfer().toISOString().slice(0, 10);
  let userId = req.session.userDetails._id;

  userHelpers.validateCoupon(req.body, userId).then((response) => {
    req.session.couponTotal = response.total;
    if (response.success) {
      res.json({
        couponSuccess: true,
        total: response.total + deliveryCharges,
        discountpers: response.discountAmountPercentage,
      });
    } else if (response.couponUsed) {
      res.json({ couponUsed: true });
    } else if (response.couponExpired) {
      res.json({ couponExpired: true });
    } else if (response.couponMaxLimit) {
      res.json({ couponMaxLimit: true });
    } else {
      res.json({ invalidCoupon: true });
    }
  })
});

router.post('/search',async(req,res)=>{
  let key = req.body.key
  productHelpers.getSearchProducts(key).then((response)=>{
    filterResult = response

    res.redirect('/filterPage')
  })
})

router.get('/shop',(req,res)=>{
  productHelpers.getProducts().then(async(products)=>{
    filterResult = products

    res.redirect('/filterPage')
  })
})

router.get('/filterPage',async(req,res)=>{
  let cartcount = "";
  let user = req.session.userDetails;
  if (user) {
    cartcount = await userHelpers.getCartCount(req.session.userDetails._id);
  }
  let category = await productHelpers.getCategories();
  let brands = await productHelpers.getBrands()
  res.render("user/shop/shop", {
    filterResult,
    category,
    brands,
    cartcount,
    user
  });
})

router.get('/filterBrands/:id',(req,res)=>{
  const brandFilter = req.params.id
  productHelpers.filterBrands(brandFilter).then((result)=>{
    filterResult = result

    res.redirect('/filterPage')
  })
})

router.post('/search-filter',(req,res)=>{
  const a = req.body
  const price = parseInt(a.MRP)
  const brandFilter= a.brand
  const categoryFilter = a.category

  productHelpers.searchFilter(brandFilter,categoryFilter,price).then((result)=>{
    console.log('returnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn');
    filterResult = result
    res.json({status:true})
  })
})

module.exports = router;
