const { default: swal } = require("sweetalert");
const { response } = require("../../app");
const { removeFromCart } = require("../../helpers/userHelpers");

function addToCart(proId) {
  $.ajax({
    url: "/add-to-cart/" + proId,
    method: "get",
    success: (response) => {
      if (response.status) {
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
      }
      addToCartAlert(response);
      //alert(`Add ${response.response.proName} to cart?`);
    },
  });
}

function addToCartAlert(response) {
  Swal.fire({
    title: `${response.response.productName} was added to Cart`,
    icon: "success",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "OK",
  }).then((result) => {});
}

// function removeProductFromCart(cartId) {
//   $.ajax({
//     url: "/remove-product-forCart",
//     data: {
//       cart: cartId,
//     },
//     method: "post",
//     success: (response) => {
//       if (response) {
//         removeFromCartAlert()
//         //alert("Are you sure to remove this product from cart?");
//        // location.reload();
//       }
//     },
//   });
// }

// function removeFromCartAlert() {
//   Swal.fire({
//     title: "Are you sure?",
//     text: "You won't be able to revert this!",
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#ff7300",
//     cancelButtonColor: "#d33",
//     confirmButtonText: "Yes, delete it!",
//   }).then((result) => {
//     if (result.isConfirmed) {
//       location.reload()

//     }
//   });
// }

function addToWish(proId) {
  console.log("wish adding ajax");
  $.ajax({
    url: "/addToWish/" + proId,
    method: "get",

    success: (response) => {
      if (response.msg) {
        addWishlist();
      } else if (response.err) {
        alreadyExist();
      } else {
        loginFirst();
      }
    },
  });
}

function addWishlist() {
  Swal.fire({
    title: "Product Added to Wishlist",
    icon: "success",
    confirmButtonColor: "#ff7300",
    confirmButtonText: "OK",
  }).then((result) => {});
}

function alreadyExist() {
  Swal.fire({
    title: "Item already exists in Wishlist",
    icon: "warning",
    confirmButtonColor: "#ff7300",
    confirmButtonText: "OK",
  }).then((result) => {});
}

function loginFirst() {
  Swal.fire({
    title: "Please, You have to login first!",
    icon: "warning",
    confirmButtonColor: "#ff7300",
    confirmButtonText: "OK",
  }).then((result) => {
    location.href = "/user-login";
  });
}