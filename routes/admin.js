var express = require("express");
const { response } = require("../app");
const { addBrandName } = require("../helpers/product-helpers");
const productHelpers = require("../helpers/product-helpers");
var router = express.Router();
const userHelpers = require("../helpers/userHelpers");
const Storage = require("../middleware/multer");
const adminHelpers = require('../helpers/adminHelpers')



/* GET home page. */

router.get("/", function (req, res) {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  );
  if (req.session.adminLoggedIn) {
    res.redirect("/admin/admin-home", { admin: true });
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

router.get("/admin-home", (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  );
  req.session.adminLoggedIn;
  res.render("admin/admin-home", {
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
  req.session.brandExistErr=null
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
      err1:req.session.categoryExistErr,
      err2:req.session.subcategoryExitsErr,
      adminDetails: true,
      layout: "admin-layout",
    });
    req.session.categoryExistErr=null
    req.session.subcategoryExitsErr=null
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

router.post(
  "/add-product",
  Storage.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  (req, res) => {
    console.log(req.body);
    console.log(req.files);

    const img1 = req.files.image1[0].filename;
    const img2 = req.files.image1[0].filename;
    const img3 = req.files.image1[0].filename;
    const img4 = req.files.image1[0].filename;
    console.log(img1, img2, img3, img4);

    productHelpers
      .addProduct(req.body, img1, img2, img3, img4)
      .then((response) => {
        console.log(response);
        req.flash("msg", "Product Added Successfully");
        res.redirect("/admin/add-product");
      });
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

router.post(
  "/edit-products/:id",
  Storage.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  (req,res)=>{
    const proId = req.params.id
    const img1 = req.files.image1?req.files.image1[0].filename:req.body.image1;
    const img2 = req.files.image2?req.files.image2[0].filename:req.body.image2;
    const img3 = req.files.image3?req.files.image3[0].filename:req.body.image3;
    const img4 = req.files.image4?req.files.image4[0].filename:req.body.image4;

    console.log(img1,img2,img3,img4);
    productHelpers.editProducts(req.body,proId,img1,img2,img3,img4).then((response)=>{
      console.log("Response: "+response);
      req.flash("msg",response.updateProduct.Product_Name,response.msg)
      res.redirect('/admin/admin-products')
    })
  }
);

router.get('/manage-users',async(req,res)=>{
  const users = await userHelpers.getUsers() 
  res.render('admin/users/manage-users',{users,adminDetails:true,layout:"admin-layout"})
})

router.get('/blockUser/:id',(req,res)=>{
  const proId = req.params.id
  console.log(proId);
  console.log("Going to block User");
  adminHelpers.blockUser(proId).then((response)=>{
    console.log(response);
    res.json({msg:"Block this user?",status:true})
  })
})

router.get('/unblockUser/:id',(req,res)=>{
  const proId = req.params.id
  adminHelpers.unblockUser(proId).then((response)=>{
    console.log(response);
    res.json({msg:"Unblock this user?",status:true})
  })
})

router.get('/manage-coupon',(req,res)=>{
  adminHelpers.getAllCoupons(req.body).then((response)=>{

    const allCoupons = response
    res.render('admin/manage-coupon',{allCoupons,adminDetails:true,layout:'admin-layout'})
  })
})

router.get('/add-coupon',(req,res)=>{
  res.render('admin/add-coupon',{adminDetails:true,layout:'admin-layout'})
  console.log();
})

router.post('/add-coupon',async(req,res)=>{

  await adminHelpers.addCoupon(req.body).then(()=>{
    res.redirect('/admin/manage-coupon')
  })
})

router.get('deleteCoupon/:id',(req,res)=>{
  const couponId = req.params.id
  console.log(couponId);
  console.log('hi');
  adminHelpers.deleteCoupon(couponId).then((response)=>{
    req.session.couponDelete = response
    res.redirect('/admin/manage-coupon')
  })
})

module.exports = router;
