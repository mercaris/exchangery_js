$('#newsletter').submit(function() {
    requestData = { email: $('[name=email]').val() };	
    $(this).addClass("loading");
    $.ajax({
	type: 'POST',
	url: 'list/subscribe', 
	contentType: 'application/json; charset=utf-8', 
	dataType: 'json',
	processData : false,
	data: JSON.stringify(requestData),
	success: function(data) {
	    alert("Thank you!");
	}
    });
    $(this).removeClass("loading");
    $('[name=email]').val("");
    return false;
});