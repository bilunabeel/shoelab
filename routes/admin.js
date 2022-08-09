var express = require("express");
const { response } = require("../app");
const { addBrandName } = require("../helpers/product-helpers");
const productHelpers = require("../helpers/product-helpers");
var router = express.Router();
const userHelpers = require("../helpers/userHelpers");
const Storage = require("../middleware/multer");
const adminHelpers = require('../helpers/adminHelpers')
const moment = require('moment')
const fs = require('fs');
const { encode } = require("punycode");
const sharp = require('sharp')



/* GET home page. */

router.get("/", function (req, res) {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  );
  if (req.session.adminLoggedIn) {
    res.redirect("/admin/admin-home", { adminDetails: true });
  } else {
    res.render("admin/admin-login", {
      layout: false,
      adminLoginErr: req.session.adminLoginErr,
    });
  }
});

router.post("/admin-login", (req, res) => {
  adminHelpers.doAdminLogin(req.body).then((response) => {
    console.log(response);
    if (response.status) {
      req.session.adminDetails = response.admin;
      req.session.adminLoggedIn = true;
      res.redirect("/admin/admin-home");
    } else {
      req.session.adminLoginErr = "Invalid Username or Password";
      res.redirect("/admin");
    }
  });
});

router.get('/admin-logout', (req, res) => {
  res.header(
    'Cache-control',
    'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0'
  );
  req.session.destroy()
  res.redirect('/admin')
})

router.get("/admin-home", (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  );
  req.session.adminLoggedIn;
  res.render("admin/report", {
    adminDetails: true,
    layout: "admin-layout",
  });
});

router.get("/add-brands", (req, res) => {
  res.render("admin/products/add-brands", {
    err: req.session.brandExistErr,
    adminDetails: true,
    layout: "admin-layout",
  });
  req.session.brandExistErr = null
});

router.post("/add-brands", (req, res) => {
  productHelpers
    .addBrandName(req.body)
    .then((response) => {
      console.log("Welcome: ");
      console.log(response);
      res.redirect("/admin/admin-products");
    })
    .catch((err) => {
      req.session.brandExistErr = err.msg;
      res.redirect("/admin/add-brands");
      console.log(err);
    });
});

router.get("/add-category", (req, res) => {
  productHelpers.getCategories().then((allCategory) => {
    res.render("admin/products/add-category", {
      allCategory,
      err1: req.session.categoryExistErr,
      err2: req.session.subcategoryExitsErr,
      adminDetails: true,
      layout: "admin-layout",
    });
    req.session.categoryExistErr = null
    req.session.subcategoryExitsErr = null
  });
});

router.post("/add-category", (req, res) => {
  productHelpers
    .addCategory(req.body)
    .then((response) => {
      console.log(response);
      res.redirect("/admin/add-category");
    })
    .catch((err) => {
      req.session.categoryExistErr = err.msg
      res.redirect("/admin/add-category");
      console.log(err);
    });
});

router.post("/add-subcategory", (req, res) => {
  productHelpers
    .addSubcategory(req.body)
    .then((response) => {
      console.log(response);
      res.redirect("/admin/add-category");
    })
    .catch((err) => {
      req.session.subcategoryExitsErr = err.msg
      res.redirect("/admin/add-category");
      console.log(err);
    });
});

router.get("/admin-products", async (req, res) => {
  const products = await productHelpers.getProducts();
  const brands = await productHelpers.getBrands();
  const categories = await productHelpers.getCategories();
  const subcategories = await productHelpers.getSubcategories();
  console.log(products);
  const alert = req.flash("msg");
  res.render("admin/products/admin-products", {
    alert,
    brands,
    subcategories,
    categories,
    products,
    adminDetails: true,
    layout: "admin-layout",
  });
});

router.get("/add-product", async (req, res) => {
  const category = await productHelpers.getCategories();
  const brand = await productHelpers.getBrands();
  const subcategory = await productHelpers.getSubcategories();
  console.log(category + "\n" + brand + "\n" + subcategory);

  res.render("admin/products/add-product", {
    category,
    brand,
    subcategory,
    adminDetails: true,
    layout: "admin-layout",
  });
});

router.post("/add-product",
  Storage.array('image'),
  async(req, res) => {

    const { files } = req

    if (!files) {
      const error = new Error('Please select a file...')
      error.httpStatusCode = 400
      return next(error)
    }
    const imgArray = files.map((file) => {
      const img = fs.readFileSync(file.path)
      return (encode_image = img.toString('base64'))
    })

    const finalImg = []
    imgArray.map((src, index) => {
      const result = finalImg.push({
        filename: files[index].originalname,
        contentType: files[index].mimetype,
        imageBase64: src
      })
      return result
    })

    productHelpers
      .addProduct(req.body, finalImg)
      .then((response) => {
        console.log(response);
        req.flash("msg", "Product Added Successfully");
        res.redirect("/admin/add-product");
      }).catch((err) => { })
  }
);

router.get("/deleteProduct/:id", (req, res) => {
  const proId = req.params.id;
  console.log("log1: " + proId);
  productHelpers.deleteProduct(proId).then((response) => {
    req.session.removedProduct = response;
    req.flash("msg", "Product Deleted..!");
    res.redirect("/admin/admin-products");
  });
  console.log(proId);
});

router.get("/edit-products/:id", async (req, res) => {
  const product = await productHelpers.getoneProduct(req.params.id);
  console.log("-------------------------------------------------------------");
  console.log(product._id);
  const brands = await productHelpers.getBrands();
  const categories = await productHelpers.getCategories();
  const subcategories = await productHelpers.getSubcategories();
  res.render("admin/products/edit-products", {
    adminDetails: true,
    layout: "admin-layout",
    product,
    brands,
    categories,
    subcategories,
  });
});

router.post("/edit-products/:id", Storage.array('files', 4), async (req, res) => {

  let file = req.files
  const imgArray = file.map((file) => {
    const img = fs.readFileSync(file.path)
    return (encode_image = img.toString('base64'))
  })

  const finalImg = []
  await imgArray.map((src, index) => {
    const result = finalImg.push({
      filename: file[index].originalName,
      contentType: file[index].mimetype,
      imageBase64: src
    })
    return result
  })

  productHelpers.editProducts(req.params.id, finalImg, req.body).then(() => {
    res.redirect('/admin/admin-products')
  })
}
);

router.get('/manage-users', async (req, res) => {
  const users = await userHelpers.getUsers()
  res.render('admin/users/manage-users', { users, adminDetails: true, layout: "admin-layout" })
})

router.get('/blockUser/:id', (req, res) => {
  const proId = req.params.id
  console.log(proId);
  console.log("Going to block User");
  adminHelpers.blockUser(proId).then((response) => {
    console.log(response);
    res.json({ msg: "Block this user?", status: true })
  })
})

router.get('/unblockUser/:id', (req, res) => {
  const proId = req.params.id
  adminHelpers.unblockUser(proId).then((response) => {
    console.log(response);
    res.json({ msg: "Unblock this user?", status: true })
  })
})

router.get('/manage-coupon', (req, res) => {
  adminHelpers.getAllCoupons(req.body).then((response) => {

    const allCoupons = response
    res.render('admin/manage-coupon', { allCoupons, adminDetails: true, layout: 'admin-layout' })
  })
})

router.get('/add-coupon', (req, res) => {
  res.render('admin/add-coupon', { adminDetails: true, layout: 'admin-layout' })
  console.log();
})

router.post('/add-coupon', async (req, res) => {

  await adminHelpers.addCoupon(req.body).then(() => {
    res.redirect('/admin/manage-coupon')
  })
})

router.get('/deleteCoupon/:id', (req, res) => {

  console.log(req.params.id);
  console.log('hi');
  adminHelpers.deleteCoupon(req.params.id).then((response) => {
    //req.session.couponDelete = response
    res.json({ couponDeleted: true })
  })
})

router.get('/manage-orders', async (req, res) => {
  userHelpers.allorders().then((response) => {
    const allOrders = response

    allOrders.forEach((element) => {
      element.ordered_on = moment(element.ordered_on).format("MMM Do YY");
    });
    res.render('admin/manage-orders', { allOrders, adminDetails: true, layout: 'admin-layout' })
  })
})

router.get('/viewAdminOrderPros/:id', (req, res) => {
  userHelpers.getOrderProducts(req.params.id).then((response) => {
    const order = response
    const ordered_on = moment(order.ordered_on).format("MMM Do YY");
    res.render('admin/viewAdminOrdersPros', {order,ordered_on, adminDetails: true, layout: 'admin-layout' })
  })
})

router.post('/changeOrderStatus',(req,res)=>{
  console.log(req.body);
  console.log('change inside');

  adminHelpers.changeOrderStatus(req.body).then((response)=>{
    res.redirect('/admin/viewAdminOrdersPros')
  })
})

router.get('/report', async (req, res) => {
  [orderCount, productCount] = await Promise.all([
    userHelpers.getOrderCount(),
    userHelpers.getProductCount()
  ])
  res.render('admin/report', { orderCount, productCount, adminDetails: true, layout: 'admin-layout' })
})

router.post("/getData", (req, res) => {
  //console.log("getData");
  
  const date = new Date(Date.now());
  const month = date.toLocaleString("default", { month: "long" });

  adminHelpers.salesReport(req.body).then((data) => {
    console.log(data);

    //let pendingAmount = data.pendingAmount;
    let salesReport = data.salesReport;
    let brandReport = data.brandReport;
    let orderCount = data.orderCount;
    let totalAmountPaid = data.totalAmountPaid;
    let totalAmountRefund = data.totalAmountRefund;

    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    });
    let brandArray = [];
    let sumArray = [];
    brandReport.forEach((s) => {
      brandArray.push(s._id);
      sumArray.push(s.totalAmount);
      console.log(brandArray);
    });
    res.json({
      totalAmountRefund,
      dateArray,
      totalArray,
      brandArray,
      sumArray,
      orderCount,
      totalAmountPaid,

    });
  });
});

module.exports = router;
