$('#newsletter').submit(function() {
    requestData = { email: $('[name=email]').val() };			
    $.ajax({
	type: 'POST',
	url: 'list/subscribe', 
	contentType: 'application/json; charset=utf-8', 
	dataType: 'json',
	processData : false,
	data: JSON.stringify(requestData),
	success: function(data) {
	    console.log(data);
	}
    });
    return false;
});