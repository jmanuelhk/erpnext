// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

// shopping cart
// eesto es una lineade comentario

frappe.provide("erpnext.shopping_cart");
var shopping_cart = erpnext.shopping_cart;

var getParams = function (url) {
	var params = [];
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

frappe.ready(function() {
	var full_name = frappe.session && frappe.session.user_fullname;
	// update user
	if(full_name) {
		$('.navbar li[data-label="User"] a')
			.html('<i class="fa fa-fixed-width fa fa-user"></i> ' + full_name);
	}
	// set coupon code and sales partner code

	var url_args = getParams(window.location.href);

	var referral_coupon_code = url_args['cc'];
	var referral_sales_partner = url_args['sp'];

	var d = new Date();
	// expires within 30 minutes
	d.setTime(d.getTime() + (0.02 * 24 * 60 * 60 * 1000));
	var expires = "expires="+d.toUTCString();
	if (referral_coupon_code) {
		document.cookie = "referral_coupon_code=" + referral_coupon_code + ";" + expires + ";path=/";
	}
	if (referral_sales_partner) {
		document.cookie = "referral_sales_partner=" + referral_sales_partner + ";" + expires + ";path=/";
	}
	referral_coupon_code=frappe.get_cookie("referral_coupon_code");
	referral_sales_partner=frappe.get_cookie("referral_sales_partner");

	if (referral_coupon_code && $(".tot_quotation_discount").val()==undefined ) {
		$(".txtcoupon").val(referral_coupon_code);
	}
	if (referral_sales_partner) {
		$(".txtreferral_sales_partner").val(referral_sales_partner);
	}
	// update login
	shopping_cart.show_shoppingcart_dropdown();
	shopping_cart.set_cart_count();
	shopping_cart.bind_dropdown_cart_buttons();
});

$.extend(shopping_cart, {
	show_shoppingcart_dropdown: function() {
		$(".shopping-cart").on('shown.bs.dropdown', function() {
			if (!$('.shopping-cart-menu .cart-container').length) {
				return frappe.call({
					method: 'erpnext.shopping_cart.cart.get_shopping_cart_menu',
					callback: function(r) {
						if (r.message) {
							$('.shopping-cart-menu').html(r.message);
						}
					}
				});
			}
		});
	},

	update_cart: function(opts) {
		if(frappe.session.user==="Guest") {
			if(localStorage) {
				localStorage.setItem("last_visited", window.location.pathname);
			}
			window.location.href = "/login";
		} else {
			return frappe.call({
				type: "POST",
				method: "erpnext.shopping_cart.cart.update_cart",
				args: {
					item_code: opts.item_code,
					qty: opts.qty,
					additional_notes: opts.additional_notes !== undefined ? opts.additional_notes : undefined,
					with_items: opts.with_items || 0
				},
				btn: opts.btn,
				callback: function(r) {
					shopping_cart.set_cart_count();
					if (r.message.shopping_cart_menu) {
						$('.shopping-cart-menu').html(r.message.shopping_cart_menu);
					}
					if(opts.callback)
						opts.callback(r);
				}
			});
		}
	},

	set_cart_count: function() {
		var cart_count = frappe.get_cookie("cart_count");
		if(frappe.session.user==="Guest") {
			cart_count = 0;
		}

		// if(cart_count) {
		// 	$(".shopping-cart").toggleClass('hidden', true);
		// }

		var $cart = $('.shopping-cart');
		var $badge = $cart.find("#cart-count");

		if(parseInt(cart_count) === 0 || cart_count === undefined) {
			$cart.css("display", "inline");
			$(".cart-items").html('Cart is Empty');
			$(".cart-tax-items").hide();
			$(".btn-place-order").hide();
			$(".cart-addresses").hide();
			$(".cart-icon").show();
		}
		else {
			$cart.css("display", "inline");
			$(".cart-icon").show();
		}

		if(cart_count) {
			$badge.html(cart_count);
		}else{
			cart_count = 0;
			$badge.html(cart_count);
		}
	},

	shopping_cart_update: function({item_code, qty, cart_dropdown, additional_notes}) {
		frappe.freeze();
		shopping_cart.update_cart({
			item_code,
			qty,
			additional_notes,
			with_items: 1,
			btn: this,
			callback: function(r) {
				frappe.unfreeze();
				if(!r.exc) {
					$(".cart-items").html(r.message.items);
					$(".cart-tax-items").html(r.message.taxes);
					if (cart_dropdown != true) {
						$(".cart-icon").show();
					}
				}
			},
		});
	},


	bind_dropdown_cart_buttons: function () {
		$(".cart-icon").on('click', '.number-spinner button', function () {
			var btn = $(this),
				input = btn.closest('.number-spinner').find('input'),
				oldValue = input.val().trim(),
				newVal = 0;

			if (btn.attr('data-dir') == 'up') {
				newVal = parseInt(oldValue) + 1;
			} else {
				if (oldValue > 1) {
					newVal = parseInt(oldValue) - 1;
				}
			}
			input.val(newVal);
			var item_code = input.attr("data-item-code");
			shopping_cart.shopping_cart_update({item_code, qty: newVal, cart_dropdown: true});
			return false;
		});

	},

});
