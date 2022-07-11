const productDatas = require("../models/productData");
const brands = require("../models/brand");
const categories = require("../models/category");
const subcategories = require("../models/subCategory");
const productData = require("../models/productData");
const userData = require('../models/user')
const { resolve, reject } = require("promise");
const { default: mongoose } = require("mongoose");
// const category = require("../models/category");

module.exports = {
  addBrandName: (brandData) => {
    return new Promise(async (resolve, reject) => {
      const brandNames = brandData.Brand_Name;
      //console.log(brandNames);

      const brandexist = await brands.findOne({ Brand_Name: brandNames });
      if (brandexist) {
        reject({ status: false, msg: "This Brand already exists!" });
      } else {
        const addBrand = await new brands({
          Brand_Name: brandNames,
        });
        await addBrand.save(async (err, result) => {
          if (err) {
            reject({ msg: "Brand can't be added" });
          } else {
            resolve({ result, msg: "New Brand added" });
          }
        });
      }
    });
  },

  getBrands: () => {
    return new Promise(async (resolve, reject) => {
      const brandsData = await brands.find({}).lean();
      resolve(brandsData);
    });
  },

  addCategory: (categoryData) => {
    return new Promise(async (resolve, reject) => {
      const categoryName = categoryData.Category;
      console.log(categoryName);

      const categoryexist = await categories.findOne({
        Category: categoryName,
      });
      if (categoryexist) {
        reject({ status: false, msg: "Entered Category already exists!" });
      } else {
        const addCategories = await new categories({
          Category: categoryName,
        });
        await addCategories.save(async (err, result) => {
          if (err) {
            reject({ msg: "Category can't be added" });
          } else {
            resolve({ result, msg: "New Category Added" });
          }
        });
      }
    });
  },

  getCategories: () => {
    return new Promise(async (resolve, reject) => {
      const allCategory = await categories.find({}).lean();
      resolve(allCategory);
    });
  },

  addSubcategory: (subcategoryData) => {
    return new Promise(async (resolve, reject) => {
      const subcategoryName = subcategoryData.Sub_category;
      console.log(subcategoryData);

      const subcategoryFind = await subcategories.findOne({
        Sub_category: subcategoryName,
      });
      const categoryFind = await categories.findOne({
        Category: subcategoryData.Category,
      });
      if (subcategoryFind) {
        reject({ status: false, msg: "Entered Subcategory already exist" });
      } else {
        const addSubcategories = await new subcategories({
          Sub_category: subcategoryName,
          Category: categoryFind._id,
        });

        await addSubcategories.save(async (err, result) => {
          if (err) {
            reject({ msg: "Subcategory can't be added" });
          } else {
            resolve({ result, msg: "New Subcategory Added" });
          }
        });
      }
    });
  },

  getSubcategories: () => {
    return new Promise(async (resolve, reject) => {
      const allSubcategory = await subcategories.find({}).lean();
      resolve(allSubcategory);
    });
  },

  addProduct: (data, image1, image2, image3, image4) => {
    return new Promise(async (resolve, reject) => {
      const subcategoryData = await subcategories.findOne({
        Sub_category: data.Subcategory,
      });
      const brandData = await brands.findOne({ Brand_Name: data.brand });
      const categoryData = await categories.findOne({
        Category: data.Category,
      });

      console.log("Subcategory: " + subcategoryData);
      console.log("Brand: " + brandData);
      console.log("Category: " + categoryData);

      if (!image2) {
        reject({ msg: "Upload Image" });
      } else {
        const newProduct = await productData({
          Product_Name: data.Product_Name,
          Description: data.Description,
          MRP: data.MRP,
          Discount: data.Discount,
          Size: data.Size,
          Stock: data.Stock,
          Color: data.Color,
          Category: categoryData._id,
          Sub_category: subcategoryData._id,
          Brand: brandData._id,
          Images: { image1, image2, image3, image4 },
        });
        await newProduct.save(async (err, result) => {
          if (err) {
            reject({ msg: "Product can't be added" });
          } else {
            resolve({ data: result, msg: "Product Added Successfully" });
          }
        });
      }
    });
  },

  getProducts: () => {
    return new Promise(async (resolve, reject) => {
      const allProducts = await productDatas.find().populate(["Category","Sub_category","Brand"]).sort({_id:-1}).lean();
      resolve(allProducts);
    });
  },

  getoneProduct: (data) => {
    return new Promise(async (resolve, reject) => {
      const theProduct = await productDatas.findOne({_id:data}).populate(["Category","Sub_category","Brand"]).lean();
      console.log(theProduct);
      resolve(theProduct);
    });
  },

  getSearchProducts:(key)=>{
    return new Promise(async(resolve,reject)=>{
      const products = await productData.find({
        $or:[
          { Product_Name: { $regex: new RegExp("^" + key + ".*", "i") } },
        ]
      }).lean()
      resolve(products)
    })
  },

  filterBrands:(brandFilter)=>{
    return new Promise(async(resolve,reject)=>{
      const brandId = mongoose.Types.ObjectId(brandFilter)
      result=await productData.aggregate([
        {
          $match:{Brand:brandId}
        }
      ])
      resolve(result)
    })
  },

  searchFilter:(brandFilter,categoryFilter,price)=>{
    console.log('ladsfjhkjhhhhhhhhhhhhhhhhhhhhhhhhhhh');
    return new Promise(async(resolve,reject)=>{
      let result 
      if(brandFilter && categoryFilter){
        const brandId = mongoose.Types.ObjectId(brandFilter)
        const categoryId = mongoose.Types.ObjectId(categoryFilter)
        result = await productData.aggregate([
          {
            $match:{Brand:brandId}
          },
          {
            $match:{Category:categoryId}
          },
          {
            $match:{MRP:{$lt:price}}
          }
        ])
      }else if(brandFilter){
        const brandId = mongoose.Types.ObjectId(brandFilter)
        result = await productData.aggregate([
          {
            $match:{Brand:brandId}
          },
          {
            $match:{MRP:{$lt:price}}
          }
        ])
      }else if(categoryFilter){
        const categoryId = mongoose.Types.ObjectId(categoryFilter)
        result = await productData.aggregate([
          {
            $match:{Category:categoryId}
          },
          {
            $match:{MRP:{$lt:price}}
          }
        ])
      }else{
        result = await productData.aggregate([
          {
            $match:{MRP:{$lt:price}}
          }
        ])
      }
      resolve(result)
    })
  },


  deleteProduct: (proId) => {
    console.log("log2: " + proId);
    return new Promise(async (resolve, reject) => {
      let productId = proId;
      const removedProduct = await productData.findByIdAndDelete({
        _id: productId,
      });
      resolve(removedProduct);
    });
  },

  editProducts: (data, proId, image1, image2, image3, image4) => {
    return new Promise(async (resolve, reject) => {
      console.log("jglskdj");
      const subcategoryData = await subcategories.findOne({
        _id: data.Sub_category
      });
      const brandData = await brands.findOne({ _id: data.Brand });
      const categoryData = await categories.findOne({
        _id: data.Category
      });
      console.log(categoryData);
      const updateProduct = await productData.findByIdAndUpdate(
        { _id: proId },
        {
          $set: {
            Product_Name: data.Product_Name,
            Description: data.Description,
            MRP: data.MRP,
            Discount: data.Discount,
            Size: data.Size,
            Stock: data.Stock,
            Color: data.Color,
            Category: categoryData._id,
            Sub_category: subcategoryData._id,
            Brand: brandData._id,
            Images: { image1, image2, image3, image4 },
          },
        }
      ); resolve({updateProduct, msg:"The Product is Edited"})
    });
  },
};
