const db = require("../config/connection");
const nodeMailer = require("nodemailer");
const bcrypt = require("bcrypt");
const wishlistModel = require("../models/wishlist");
const userdatas = require("../models/user");
const { response, use } = require("../app");
const adminDatas = require("../models/adminData");
const { resolve, reject } = require("promise");
const cartModel = require("../models/cart");
const productModel = require("../models/productData");
const { default: mongoose } = require("mongoose");
const { exists, findOne } = require("../models/user");
const orderModel = require("../models/order");
const Razorpay = require("razorpay");
const { promises } = require("nodemailer/lib/xoauth2");
const { log } = require("console");
const wishlist = require("../models/wishlist");
const couponData = require("../models/coupon");
require("dotenv").config();

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_KEY,
});

module.exports = {
  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      let user = await userdatas.findOne({ Email: userData.Email });
      if (user) {
        reject({ status: false, message: "Email Already Exists!" });
      } else {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        console.log(userData);

        const otpGenerator = await Math.floor(1000 + Math.random() * 9000);
        const addUser = await {
          Firstname: userData.Firstname,
          Lastname: userData.Lastname,
          Mobile: userData.Mobile,
          Email: userData.Email,
          Password: userData.Password,
          otp: otpGenerator,
        };

        console.log(addUser);
        if (addUser) {
          try {
            const mailTransporter = nodeMailer.createTransport({
              host: "smtp.gmail.com",
              service: "gmail",
              port: 465,
              secure: true,
              auth: {
                user: process.env.NODEMAILER_USER,
                pass: process.env.NODEMAILER_PASS,
              },
              tls: {
                rejectUnauthorized: false,
              },
            });
            const mailDetailes = {
              from: "bilunabeelmv@gmail.com",
              to: userData.Email,
              subject: "Just testing nodemailer bro!",
              text: "just random texts",
              html:
                "<p>Hi " +
                userData.Firstname +
                "" +
                userData.Lastname +
                " your OTP is: " +
                otpGenerator +
                "",
            };
            mailTransporter.sendMail(mailDetailes, (err, info) => {
              if (err) {
                console.log(err);
              } else {
                console.log("email has been sent ", info.response);
              }
            });
          } catch (error) {
            console.log(error.message);
          }
        }
        resolve(addUser);
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      const user = await userdatas.findOne({ Email: userData.Email });

      let response = {};

      if (user) {
        if (user.block) {
          reject({ status: false, msg: "Admin Blocked you!" });
        } else {
          bcrypt.compare(userData.Password, user.Password).then((status) => {
            if (status) {
              console.log("Login Success...");
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              console.log("Login Failed...");
              resolve({ status: false });
            }
          });
        }
      } else {
        console.log("Login Failed...");
        resolve({ status: false });
      }
    });
  },

  doReset: (userData) => {
    return new Promise(async (resolve, reject) => {
      const user = await userdatas.findOne({ Email: userData.Email });

      if (user) {
        console.log("Email matched " + user);
        const otpGenerator = await Math.floor(1000 + Math.random() * 9000);
        const resetData = await {
          rId: user._id,
          Email: userData.Email,
          otp: otpGenerator,
        };
        console.log(resetData);

        try {
          const mailTransporter = nodeMailer.createTransport({
            host: "smtp.gmail.com",
            service: "gmail",
            port: 465,
            secure: true,
            auth: {
              user: "bilunabeelmv@gmail.com",
              pass: "fjmephfzlicvdcem",
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
          const mailDetailes = {
            from: "bilunabeelmv@gmail.com",
            to: userData.Email,
            subject: "Just testing nodemailer bro!",
            text: "just random texts",
            html:
              "<p>Hi " +
              user.Firstname +
              "" +
              user.Lastname +
              " your reset OTP is: " +
              otpGenerator +
              "",
          };
          mailTransporter.sendMail(mailDetailes, (err, info) => {
            if (err) {
              console.log(err);
            } else {
              console.log("email has been sent ", info.response);
            }
          });
        } catch (error) {
          console.log(error.message);
        }
        resolve(resetData);
      } else {
        console.log("No email");
        reject({ message: "User Doesn't exist" });
      }
    });
  },

  doResetPassword: (resetData, rId) => {
    console.log(resetData);

    return new Promise(async (resolve, reject) => {
      let response = {};
      resetData.Password = await bcrypt.hash(resetData.Password, 10);

      let userId = rId;
      console.log("User Id: " + userId);
      const resetPass = await userdatas.findByIdAndUpdate(
        { _id: userId },
        { $set: { Password: resetData.Password } }
      );
      resolve(resetPass);
    });
  },

  getUsers: () => {
    return new Promise(async (resolve, reject) => {
      const allUsers = await userdatas.find({}).lean();
      resolve(allUsers);
    });
  },

  isUserBlock: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await userdatas.findOne({ _id: userId });
      resolve(user);
    });
  },

  getProductDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      const product = await productModel
        .findOne({ _id: proId })
        .lean()
        .then((product) => {
          resolve(product);
        });
    });
  },

  addToCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      // finding product's id
      const product = await productModel.findOne({ _id: proId });

      // checking if user exist in cart collection
      const userCart = await cartModel.findOne({ user: userId });

      if (userCart) {
        // checking is product exists in cart
        const proExist = userCart.products.findIndex(
          (products) => products.pro_id == proId
        );

        console.log('exist: '+proExist);
        if (proExist != -1) {
          console.log(proId);
          cartModel
            .updateOne(
              { "products.pro_id": proId, user: userId },
              { $inc: { "products.$.quantity": 1 } }
            )
            .then((response) => {
              resolve({
                productName: product.Product_Name,
                msg: "quantity added",
              });
            });
        } else {
          // if product not exists, add new product id
          await cartModel
            .findOneAndUpdate(
              { user: userId },
              {
                $push: {
                  products: {
                    pro_id: proId,
                    productName: product.Product_Name,
                    MRP: product.MRP,
                  },
                },
              }
            )
            .then(async (response) => {
              resolve({
                productName: product.Product_Name,
                msg: "'Added',count: res.products.length + 1",
              });
            });
        }
      } else {
        // if user not exists in cart, create new doc for the user and add product id
        const cartObj = new cartModel({
          user: userId,
          products: {
            pro_id: proId,
            productName: product.Product_Name,
            MRP: product.MRP,
          },
        });
        await cartObj.save((err, result) => {
          if (err) {
            resolve({ error: "cart not created" });
          } else {
            console.log("hoooy...!");
            resolve({
              productName: product.Product_Name,
              msg: "cart is added",
              count: 1,
            });
            console.log("kooi");
          }
        });
      }
    });
  },

  cartItem: (userId) => {
    return new Promise(async (resolve, reject) => {
      cartModel
        .findOne({ user: userId })
        .populate(["products.pro_id"])
        .lean()
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          reject({ err, msg: "cart error" });
        });
    });
  },

  cartItems: (userId) => {
    return new Promise(async (resolve, reject) => {
      const cartDetails = await cartModel
        .findOne({ user: userId })
        .populate("products.pro_id")
        .lean();
      console.log(cartDetails);
      resolve(cartDetails);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await cartModel.findOne({ user: userId });

      if (user) {
        count = user.products.length;
        resolve(count);
      } else {
        let count = 0;
        resolve(count);
      }
    });
  },

  changeProductQuantity: (data, user) => {
    cart = data.cart;
    proId = data.product;
    quantity = parseInt(data.quantity);
    count = parseInt(data.count);
    MRP = parseInt(data.MRP);
    const proCount = parseInt(count);
    console.log("sldfkdl " + cart);

    return new Promise(async (resolve, reject) => {
      if (count == -1 && quantity == 1) {
        await cartModel
          .findOneAndUpdate(
            { user: user._id },
            {
              $pull: { products: { _id: cart } },
            }
          )
          .then((response) => {
            resolve({ removeProductFromCart: true });
          });
      } else {
        await cartModel
          .findOneAndUpdate(
            { user: user._id, "products.pro_id": data.product },
            { $inc: { "products.$.quantity": proCount } }
          )
          .then((response) => {
            resolve(true);
          });
      }
    });
  },

  subTotal: (user) => {
    let id = mongoose.Types.ObjectId(user);
    return new Promise(async (resolve, reject) => {
      const amount = await cartModel.aggregate([
        {
          $match: { user: id },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            id: "$products.pro_id",
            total: { $multiply: ["$products.MRP", "$products.quantity"] },
          },
        },
      ]);

      let cartData = await cartModel.findOne({ user: id });

      if (cartData) {
        amount.forEach(async (amt) => {
          await cartModel
            .updateMany(
              { "products.pro_id": amt.id },
              { $set: { "products.$.subtotal": amt.total } }
            )
            .catch((err) => {
              console.log(err);
            });
        });
        resolve();
      }
    });
  },

  removeFromCart: (data, user) => {
    return new Promise(async (resolve, reject) => {
      await cartModel
        .findOneAndUpdate(
          { user: user._id },
          {
            $pull: { products: { _id: data.cart } },
          }
        )
        .then((response) => {
          resolve({ removeProduct: true });
        });
    });
  },

  totalAmount: (userdata) => {
    const id = mongoose.Types.ObjectId(userdata);

    return new Promise(async (resolve, reject) => {
      const total = await cartModel.aggregate([
        {
          $match: { user: id },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            quantity: "$products.quantity",
            MRP: "$products.MRP",
          },
        },
        {
          $project: { productName: 1, quantity: 1, MRP: 1 },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$MRP"] } },
          },
        },
      ]);
      console.log(total);

      if (total.length == 0) {
        resolve({ status: true });
      } else {
        let grandTotal = total.pop();

        resolve({ grandTotal, status: true });
      }
    });
  },

  deliveryCharge: (amount) => {
    let Dcharge = 0;
    return new Promise((resolve, reject) => {
      if (amount > 2000) {
        Dcharge = 40;
      } else {
        Dcharge = 0;
      }
      resolve(Dcharge);
    });
  },

  grandTotal: (netTotal, deliveryCharges) => {
    return new Promise((resolve, reject) => {
      const grandTotal = netTotal + deliveryCharges;
      resolve(grandTotal);
    });
  },

  addAddress: (userId, data) => {
    return new Promise(async (resolve, reject) => {
      const user = userdatas.findOne({ _id: userId });
      await userdatas.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            address: {
              fname: data.fname,
              lname: data.lname,
              house: data.house,
              towncity: data.towncity,
              district: data.district,
              state: data.state,
              pincode: data.pincode,
              email: data.email,
              mobile: data.mobile,
            },
          },
        }
      );
      resolve();
    });
  },

  getAddresses: (user) => {
    return new Promise(async (resolve, reject) => {
      const addresses = await userdatas.findOne({ _id: user }).lean();
      resolve(addresses);
    });
  },

  getAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      const address = await userdatas.aggregate([
        {
          $match: { _id: userId },
        },
        {
          $unwind: "$addresses",
        },
        {
          $match: { "addresses._id": addressId },
        },
        {
          $project: {
            addresses: 1,
            _id: 0,
          },
        },
      ]);
      resolve(address);
    });
  },

  editAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      const editAddress = await userdatas.findByIdAndUpdate({});
    });
  },

  deleteAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      const address = await userdatas.updateOne(
        { _id: userId },
        { $pull: { address: { _id: addressId } } }
      );
      resolve();
    });
  },

  editProfile: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      const editProfile = await userdatas.findByIdAndUpdate(
        { _id: userId },
        {
          $set: {
            Firstname: data.Firstname,
            Lastname: data.Lastname,
            Mobile: data.Mobile,
          },
        }
      );

      resolve(editProfile);
    });
  },

  getAllOrders: (user) => {
    return new Promise(async (resolve, reject) => {
      const allOrders = await orderModel
        .find({ userId: user })
        .populate("product.pro_id")
        .sort({ _id: -1 })
        .lean();
      resolve(allOrders);
    });
  },

  allorders: () => {
    return new Promise(async (resolve, reject) => {
      const allorders = await orderModel
        .find({})
        .populate("product.pro_id")
        .sort({ _id: -1 })
        .lean();
      resolve(allorders);
    });
  },

  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      const orderDetails = await orderModel
        .findOne({ _id: orderId })
        .populate("product.pro_id")
        .lean();
      console.log(orderDetails);
      resolve(orderDetails);
    });
  },

  getOrderCount: () => {
    return new Promise(async (resolve, reject) => {
      const orderCount = await orderModel.find({}).count();
      resolve(orderCount);
    });
  },

  getProductCount: () => {
    return new Promise(async (resolve, reject) => {
      const productCount = await productModel.find({}).count();
      resolve(productCount);
    });
  },

  placeOrder: (order, products, total, deliveryCharges, netTotal, user) => {
    return new Promise(async (resolve, reject) => {
      total = parseInt(order.total) + parseInt(deliveryCharges);
      let id = mongoose.Types.ObjectId(user._id);
      const status =
        order["paymentMethod"] === "Cash on Delivery"
          ? "Order Placed"
          : "Order Pending";

      console.log("delivery charge: " + deliveryCharges);
      console.log("order total: " + order.total);

      const orderObj = await orderModel({
        user_Id: user._id,
        Total: netTotal,
        shippingCharges: deliveryCharges,
        grandTotal: total,
        couponDiscountedPrice: order.discountedPrice,
        couponPercentage: order.discountAmountPercentage,
        couponName: order.couponName,
        PaidAmount: order.mainTotal,
        payment_status: status,
        paymentMethod: order.paymentMethod,
        ordered_on: new Date(),
        product: products.products,
        deliveryDetails: {
          fname: order.fname,
          lname: order.lname,
          mobile: order.mobile,
          email: order.email,
          house: order.house,
          towncity: order.towncity,
          district: order.district,
          state: order.state,
          pincode: order.pincode,
        },
      });
      console.log("hgsrfdhs" + products);

      await orderObj.save(async (err, res) => {
        const data = await cartModel.aggregate([
          {
            $match: { user: id },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              quantity: "$products.quantity",
              id: "$products.pro_id",
            },
          },
        ]);
        data.forEach(async (amt) => {
          await productModel.findOneAndUpdate(
            {
              _id: amt.id,
            },
            {
              $inc: { Stock: -amt.quantity },
            }
          );
        });
        await cartModel.remove({ user: order.userId });
        resolve(orderObj);
      });
    });
  },

  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      console.log("oorderId:" + orderId._id);
      const options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId._id,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("New order: ", order);
          resolve(order);
        }
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY);

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      const changeStatus = await orderModel
        .findOneAndUpdate(
          { _id: orderId },
          {
            $set: { payment_status: "Order Placed" },
          }
        )
        .then((changeStatus) => {
          resolve(changeStatus);
        });
    });
  },

  cancelOrder: (data) => {
    order = mongoose.Types.ObjectId(data.orderId);
    let quantity = parseInt(data.quantity);
    discountPrice =
      parseInt(data.subtotal) -
      (
        (parseInt(data.couponPercentage) * parseInt(data.subtotal)) /
        100
      ).toFixed(0);
    const status = "Order Cancelled";

    return new Promise(async (resolve, reject) => {
      const cancelOrder = await orderModel.updateMany(
        { _id: data.orderId, "product.pro_id": data.proId },
        {
          $set: {
            "product.$.status": status,
            "product.$.orderCancelled": true,
          },
          $inc: {
            grandTotal: -discountPrice,
            "product.$.subtotal": -parseInt(data.subtotal),
            reFund: discountPrice,
          },
        }
      );
      await productModel.findOneAndUpdate(
        { _id: data.proId },
        {
          $inc: {
            Stock: quantity,
          },
        }
      );
      let prodcuts = await orderModel.aggregate([
        {
          $match: { _id: order },
        },
        {
          $project: {
            _id: 0,
            product: 1,
          },
        },
        {
          $unwind: "$product",
        },
        {
          $match: { "product.orderCancelled": false },
        },
      ]);
      if (prodcuts.length == 0) {
        await orderModel.updateMany(
          { _id: data.orderId },
          {
            $inc: {
              reFund: data.shippingCharges,
              grandTotal: -data.shippingCharges,
            },
          }
        );
        resolve({ status: true });
      } else {
        resolve({ status: true });
      }
    });
  },

  addToWish: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      //console.log('helpers wishlist adding');
      const userData = await wishlistModel.findOne({ user_id: userId });
      if (userData) {
        console.log("userdata exist!");
        const proExist = userData.products.findIndex(
          (products) => products.pro_id == proId
        );

        if (proExist != -1) {
          console.log("wished pro exists");
          resolve({ err: "Product already exists in wishlist!" });
        } else {
          await wishlistModel.findOneAndUpdate(
            { user_id: userId },
            { $push: { products: { pro_id: proId } } }
          );
          resolve({ msg: "addded" });
        }
      } else {
        console.log("new wishlist!");
        const newWishlist = new wishlistModel({
          user_id: userId,
          products: { pro_id: proId },
        });
        await newWishlist.save((err, result) => {
          if (err) {
            console.log("not added to wish");
            resolve({ msg: "not added to wishlist" });
          } else {
            console.log("wishlist created!");
            resolve({ msg: "wishlist created!" });
          }
        });
      }
    });
  },

  getWishlist: (userId) => {
    return new Promise(async (resolve, reject) => {
      const wishlist = await wishlistModel
        .findOne({ user_id: userId._id })
        .populate("products.pro_id")
        .lean();

      resolve(wishlist);
    });
  },

  removeFromWishlist: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      const remove = await wishlistModel.updateOne(
        { user_id: userId },
        { $pull: { products: { pro_id: proId } } }
      );

      resolve({ msg: "Deleted from Wishlist!" });
    });
  },

  validateCoupon: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      obj = {};

      const coupon = await couponData.findOne({ couponCode: data.coupon });
      if (coupon) {
        if (coupon.limit > 0) {
          checkUserUsed = await couponData.findOne({
            couponCode: data.coupon,
            usedUsers: { $in: [userId] },
          });

          if (checkUserUsed) {
            obj.couponUsed = true;
            obj.msg = "You have already used a Coupon";
            resolve(obj);
            console.log(obj);
          } else {
            console.log(data.coupon);
            let nowDate = new Date();
            date = new Date(nowDate);
            if (date <= coupon.expirationTime) {
              await couponData.updateOne(
                { couponCode: data.coupon },
                { $push: { usedUsers: userId } }
              );
              console.log(date);

              await couponData.findOneAndUpdate(
                { couponCode: data.coupon },
                { $inc: { limit: -1 } }
              );
              let total = parseInt(data.total);
              let percentage = parseInt(coupon.discount);
              let discountAmount = ((total * percentage) / 100).toFixed();

              obj.discountAmountPercentage = percentage;
              obj.total = total - discountAmount;
              obj.success = true;
              resolve(obj);
            } else {
              obj.couponExpired = true;
              console.log("The coupon is expired");
              resolve(obj);
            }
          }
        } else {
          obj.couponMaxLimit = true;
          console.log("reached maximum limit");
          resolve(obj);
        }
      } else {
        obj.invalidCoupon = true;
        console.log("This coupon is invalid");
        resolve(obj);
      }
    });
  },
};
