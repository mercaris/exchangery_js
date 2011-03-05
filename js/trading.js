$(document).ready(function(){
    $.ajax({
	type: 'POST',
	url: 'ts/login', 
	contentType: 'application/json; charset=utf-8', 
	dataType: 'json',
	processData : false,
	data: JSON.stringify({username : "demo", password : "demo"}),
	success: function(data) {
	    console.log(data);
            load_market();
	}
    });	
});

var exchng;
function load_market() {
    exchng= new Exchng("123", function(event) {
	switch(event['name']) {
	case 'fetch-complete':
	    draw_market();
	    break;
	}
    });
    $('#order').submit(function() {
	requestData = {
	    order: {
		market_id: exchng.marketId,
		product_id: $('[name=symbol]').val(),
		side: $('[name=side]').val(),
		quantity: $('[name=quantity]').val(),
		price: $('[name=price]').val(),
	    }
	};
	$.ajax({
	    type: 'POST',
	    url: 'ts/orders', 
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
    exchng.fetchData();
    /*												throwing exception on $.each
												exchng.beginPoll(function(orders) {
												console.log(orders);
												
												$.each(orders, function(index, order) {
												console.log("received order: " + order);
												var product = exchng.products[order.product_id];
												product.addOrder(order);
												});
												
												});
    */
};
function draw_market() {
    $('#order [name=symbol] option').addClass('marked');
    $.each(exchng.products, function() {
	if($('#order [name=symbol] option:contains(' + this['symbol'] + ')').removeClass('marked').length == 0) {
	    $('#order [name=symbol]').append($('<option value=' + this['id'] + '></option>').text(this['symbol']));
	}
    });
    $('#order [name=symbol] option.marked').detach();
    $('#products tbody').empty();
    $.each(exchng.products, function() {
	var product = this;
	$.each(this['details'], function() {
	    var detail = this;
	    var tr = $('<tr></tr>');
	    if(!detail['best']) {
		tr.css('display', 'none');
	    }
	    tr.append($('<td></td>').text(product['symbol']));
	    $.each(['bid_quantity', 'bid', 'offer', 'offer_quantity'], function() {
		if(detail[this]) {
		    tr.append($('<td></td>').text(detail[this]));
		} else {
		    tr.append($('<td></td>'));
		}
	    });
	    $('#products tbody').append(tr);
	});
    });
};