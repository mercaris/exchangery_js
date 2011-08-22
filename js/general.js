var chart;

window.GRID_LINES_COLOR = '#D5D0CD';
window.PRICE_LINES_COLOR = '#0066FF';
var AXIS_Y_WIDTH = 30;
var AXIS_X_HEIGHT = 30;

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

	/* Random id for dev server*/
	var username = 'demo';
	var random_number = Math.floor(Math.random() * 10000);
	if (random_number < 10)
		username += '000' + random_number;
	else if (random_number < 100)
		username += '00' + random_number;
	else if (random_number < 1000)
		username += '0' + random_number;
	else
		username += random_number;
	$('#username').val(username);
	$('#password').val(username);
	/* ----------------------------- */

	$("#menu-login").click();

	$('#order_form input[name=price]').keydown(function(){
		$(this).css('color', '#000000');
	});
});

function login()
{
	$('#login-form .error-note').hide();
	$('#login-form .connect-note').hide();

	var ts = new TradingScreen("order_grid", "order_form", "detail_pane", "detail_grid");
	ts.connect("123", $('#username').val(), $('#password').val());
}

function logout()
{

}