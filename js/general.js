$(document).ready(function() {
	$('#menu-login').fancybox({
		modal: true,
		titleShow: false,
		padding: 20
	});

	jQuery("#login-form").validate({
		submitHandler: function(form) {
			login();
		},
		rules: {
			username: {
				required: true
			},
			password: {
				required: true
			}
		},
		messages: {
			username: {
				required: "Please enter a username"
			},
			password: {
				required: "Please provide a password"
			}
		}
	});

	$("#menu-login").click();
});

function login()
{
	$('#login-form .error-note').hide();

	var ts = new TradingScreen("order_grid", "order_form", "detail_pane", "detail_grid");
	ts.connect("123", $('#username').val(), $('#password').val());
}

function logout()
{

}