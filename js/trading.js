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
            init_market();
	}
    });	
});

var exchng;
function init_market() {
    exchng = new Exchng("123", function(event) {
	switch(event['name']) {
	case 'fetch-complete':
	    draw_market();
	    break;
	}
    });
    $('#order').submit(function(event) {
	event.preventDefault();

	var $this = $(this);

	if ($this.hasClass("loading")) return;

	$this.addClass("loading");

	var requestData = {
	    order: {
		market_id: exchng.marketId,
		product_id: $this.find('select[name=symbol] option:selected').val(),
		side: $this.find('select[name=side] option:selected').val(),
		quantity: $this.find('input[name=quantity]').val(),
		price: $this.find('input[name=price]').val(),
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
		$this.find("input[type=text]").val("");
		$this.removeClass("loading");
	    }
	});
    });
    exchng.fetchData();

    exchng.beginPoll(function (orders) {
	$.each(orders.market_update.orders, function (index, order) {
	    exchng.products[order.product_id].addOrder(order);
	});
	$.each(orders.market_update.fills, function (index, fill) {
	    exchng.removeOrder(fill.order_id);
	});

	draw_market();
    });
};

function draw_market() {
    detach_marked();

    var $products = $('#products tbody');
    $products.empty();

    $.each(exchng.products, function (index, product) {
	if($('#order [name=symbol] option:contains(' + product['symbol'] + ')').removeClass('marked').length == 0) {
	    $('#order [name=symbol]').append($('<option value=' + product['id'] + '></option>').text(product['symbol']));
	}
	
	product.sortOrders();

	var add_order = function (detail, $target) {
	    var $tr = $('<tr></tr>');
	    
	    var $td = $('<td></td>');
	    $td.css('width', '20%');

	    if (!detail['best']) {
		$td.text(product['symbol']);
	    }else{
		$td.html($('<a href="#">'+product['symbol']+'</a>')
			 .toggle(function (event) {
			     event.preventDefault();
			     $('#childrenOf_'+product.id).fadeIn();
			 },function (event)  {
			     event.preventDefault();
			     $('#childrenOf_'+product.id).fadeOut();
			 }));
	    }
	    $tr.append($td);

	    var add_cell = function (i, k) {
		var $td = $('<td></td>')
		if (detail[k]) {
		    $td.text(detail[k]);
		}
		$tr.append($td);
	    }

	    $.each(['bid_quantity', 'bid', 'offer', 'offer_quantity'], add_cell);

	    $target.append($tr);
	}
	
	add_order(product.details.shift(), $products);

	var $children = $('<table></table>');
	$children.css('width', '100%');
	$.each(product.details, function (i, detail) {
	    add_order(detail, $children);
	});

	var $row = $('<tr></tr>');
	$row.addClass('hidden');
	log($row.height());
	$row.attr('id', 'childrenOf_'+product.id);
	$row.append($('<td></td>').attr('colspan', 5).append($children));

	$products.append($row);
    });
}

function detach_marked() {
    $('#order [name=symbol] option').addClass('marked');
    $.each(exchng.products, function(index, product) {
	if($('#order [name=symbol] option:contains(' + product['symbol'] + ')')
	   .removeClass('marked').length == 0) {
	    $('#order [name=symbol]').append(
		$('<option value=' + this['id'] + '></option>').text(this['symbol']));
	}
    });
    $('#order [name=symbol] option.marked').detach();
}