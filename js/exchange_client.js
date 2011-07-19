/*
 * Constructor for a client to an Exchangery exchange. Takes a market id (String) as an argument.
 */
function ExchangeClient(marketId) {
    this.marketId = marketId;
    this.products = {};
    this.fetching = false;
    this.connected = false;
    this.authenticated = false;
    this.bestOrderUpdateListeners = [];
    this.productUpdateListeners = [];
    this.pollTime = 1000; //ms
}

/*
 * Before any other actions can take place, the exchange client must log in with a valid username and password (Strings)
 */
ExchangeClient.prototype.login = function(username, password, callback) {
    var exchange = this;
    $.ajax({
	type: 'POST',
	url: 'ts/login', 
	contentType: 'application/json; charset=utf-8', 
	dataType: 'json',
	processData : false,
	data: JSON.stringify({'username' : username, 'password' : password, 'market_id' : this.marketId}),
	success: function(data) {	    
		if (data['result'] == 'success') {
			exchange.authenticated = true;
		    exchange.connected = true;
		    callback();
		} else {
			//$('#login-form .error-note').show('slow');
		}		
	}
    });
};

/*
 * Market Snapshot fetches the current state of the market from the server. This must be done before an order grid can be drawn.
 */
ExchangeClient.prototype.marketSnapshot = function(callback) {
    var exchange = this;
    if (!exchange.authenticated){
	return;
    }
    exchange.fetching = true;

    //$.get('js/test.js', {

    $.get('ts/market_snapshot', {
	'market_id': exchange.marketId
    }, function(data, textStatus) {
	if(textStatus == 'success') {
  
	    var snapshot = data['snapshot'];
	    var market = snapshot['market'];
	    var products = {};
	    
	    $.each(snapshot['products'], function(i, product) {
		products[product.id] = {
		    'id': product.id,
		    'symbol': product.symbol,
		    'orders': {
			'offers': [],
			'bids': []
		    }
		};
	    });
	    
	    $.each(snapshot['orders'], function(i, order) {
		var order_list = order['side'] == 'buy' ? 'bids' : 'offers';
		products[order['product_id']]['orders'][order_list].push(order);
	    });
	    
	    exchange.products = {};
	    $.each(products, function(i, product) {
		exchange.products[i] = new ExchangeClient.Product(exchange, product['id'], product['symbol'], product['orders']);
	    });		
	}
	exchange.fetching = false;
	callback();
    }, 'json');
};

/*
 * Market Update fetches the most recent market events from the server. It polls, so it only needs to be called once.
 */
ExchangeClient.prototype.marketUpdate = function(callback) {
    var exchange = this;
    if (!exchange.authenticated){
	return;
    }

    var poll = function () {
	
	if (exchange.connected && !exchange.fetching) {	   
	    exchange.fetching = true;
	    $.ajax({
		url: 'ts/market_update', 
		dataType: 'json',
		success: function(data) {
		    try {
			$.each(data.market_update.orders, function (i, order) {
			    exchange.products[order.product_id].addOrReplaceOrder(order);
			    exchange.notifyProductUpdateListeners(order.product_id);
			});
		    }
		    catch(err) {
			alert(err);
		    }
		    callback();
		    exchange.fetching = false;
		},
		error: function (error) {
		    exchange.connected = false;
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
			$('#username-random').html(username);
		    $("#menu-login").click();
			$('#login-form .connect-note').show();
		},
	    });	    
	}
    }
    setInterval(poll, 500);
};

/*
 * Get notified when a new best bid or offer is received. callback method should take a productId as a parameter.
 */
ExchangeClient.prototype.registerBestOrderUpdateListener = function(that, callback) {
    var exchange = this;
    exchange.bestOrderUpdateListeners.push([that, callback]);
};

/*
 * Notification when a new best bid or offer is received. 
 */
ExchangeClient.prototype.notifyBestOrderListeners = function(productId) {
    var exchange = this;
    $.each(exchange.bestOrderUpdateListeners, function(i, args) {
	var that = args[0];
	var callback = args[1];
	callback.call(that, productId);
    });
};


/*
 * Get notified when a new order is received. callback method should take a productId as a parameter.
 */
ExchangeClient.prototype.registerProductUpdateListener = function(that, callback) {
    var exchange = this;

    exchange.productUpdateListeners.push([that, callback]);
};

/*
 * Notification when a new order is received. 
 */
ExchangeClient.prototype.notifyProductUpdateListeners = function(productId) {
    var exchange = this;
    $.each(exchange.productUpdateListeners, function(i, args) {
	var that = args[0];
	var callback = args[1];
	callback.call(that, productId);
    });
};


/*
 * Place an order
 */
ExchangeClient.prototype.placeOrder = function(productId, side, quantity, price, callback) {
    var exchange = this;
    var requestData = {
	    order: {
		'market_id' : exchange.marketId,
		'product_id' : productId,
		'side' : side,
		'quantity' : quantity,
		'price' : price
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
	    callback(data.result, data.errors);
	},
    });
};

/*
 * Represents a product, consists of a product id, a symbol, a list of buy orders (bids) and a list of sell orders (offers)
 */
ExchangeClient.Product = function(exchange, id, symbol, orders) {
    var product = this;
    product.exchange = exchange;
    product.id = id;
    product.symbol = symbol;
    product.orders = {
	'offers': orders['offers'].slice(0),
	'bids': orders['bids'].slice(0)
    };
    this.sortOrders();
};

/*
 * get a list of the product ids
 */
ExchangeClient.prototype.getProductIds = function() {
    var exchange = this;
    var productIds = [];
    $.each(exchange.products, function(i, product) {
	productIds.push(product.id);
    });
    return productIds;
};

/*
 * get the symbol for the given product id
 */
ExchangeClient.prototype.getSymbol = function(productId) {
    var exchange = this;
    var product = exchange.products[productId];
    if (product){
	return product.symbol;
    }
    else {
	return '';
    }
};

/*
 * get the product for an id
 */
ExchangeClient.prototype.getProduct = function (productId) {
    return this.products[productId] || '';
}

/*
 * get the quantity from the highest priced buy order for the given product
 */
ExchangeClient.prototype.getBestBidQuantity = function(productId) {
    var exchange = this;
    var product = exchange.products[productId];
    if (product){
	var bids = product.orders.bids;
	if (bids.length > 0){
	    var price = bids[0].price;
	    var ordersAtPrice = function(order) {
		return order.price == price;
	    };
	    var best_bids = bids.filter(ordersAtPrice);
	    return combinedOrderQuantity(best_bids);
	}
    }
    return '';    
};


/*
 * get the price from the highest priced buy order for the given product
 */
ExchangeClient.prototype.getBestBidPrice = function(productId) {
    var exchange = this;
    var product = exchange.products[productId];
    if (product){
	var bids = product.orders.bids;
	if (bids.length > 0){
	    return bids[0].price;	   
	}
    }
    return '';    
};

/*
 * get the quantity from the lowest priced sell order for the given product
 */
ExchangeClient.prototype.getBestOfferPrice = function(productId) {
    var exchange = this;
    var product = exchange.products[productId];
    if (product){
	var offers = product.orders.offers;
	if (offers.length > 0){
	    return offers[offers.length - 1].price;	   
	}
    }
    return '';    
};

/*
 * get the quantity from the lowest priced sell order for the given product
 */
ExchangeClient.prototype.getBestOfferQuantity = function(productId) {
    var exchange = this;
    var product = exchange.products[productId];
    if (product){
	var offers = product.orders.offers;
	if (offers.length > 0){
	    var price = offers[offers.length - 1].price;
	    var ordersAtPrice = function(order) {
		return order.price == price;
	    };
	    var best_offers = offers.filter(ordersAtPrice);
	    return combinedOrderQuantity(best_offers);
	}
    }
    return '';    
};


/*
 * Replace an order that has been updated.
 */
ExchangeClient.Product.prototype.addOrReplaceOrder = function(order) {
    var product = this;
    var orders = product['orders'];
    var orderList = orders[order['side'] == 'buy' ? 'bids' : 'offers'];
    var bestOrder = isBestOrder(order, orderList);
    var index = -1;
    $.each(orderList, function(i, o) {
	if (o.id == order.id){
	    index = i;
	    return false;
	}
    });
    if (index >= 0){
	orderList.splice(index,1,order);
	if (order.quantity == 0) {
	    orderList.splice(index,1);   
	}
    }
    else if (order.quantity > 0) {
	orderList.push(order);
	product.sortOrders();
    }
    if (bestOrder) {
	product.exchange.notifyBestOrderListeners(product.id);
    }
};


/*
 * Removes an order, to be called on cancel or fill
 */
ExchangeClient.Product.prototype.removeOrder = function (fill) {
    var product = this;

    // check bids
    var bids = product.orders.bids;
    $.each(bids, function (i, order) {	
	if (order.id == fill.order_id) {
	    var best = isBestOrder(order, bids);	    	    
	    product.orders.bids.splice(i, 1);
	    if (best) {
		product.exchange.notifyBestOrderListeners(product.id);
	    }
	    return false; // equivelant of break
	}
    });

    // check offers
    var offers = product.orders.offers;
    $.each(offers, function (i, order) {
	if (order.id == fill.order_id) {
	    var best = isBestOrder(order, offers);
	    product.orders.offers.splice(i, 1);
	    if (best) {
		product.exchange.notifyBestOrderListeners(product.id);
	    }
	    return false; // equivelant of break
	}
    });
};

/*
 * Sort orders for a product.
 */
ExchangeClient.Product.prototype.sortOrders = function() {
    var product = this;
    var orders = product.orders;

    orders['offers'].sort(function(a, b) {
	if (a.price != b.price) {
	    return b.price - a.price;
	}
	else {
	    return b.timestamp_micros - a.timestamp_micros;
	}
    });

    orders['bids'].sort(function(a, b) {
	if (a.price != b.price) {
	    return b.price - a.price;
	}
	else {
	    return a.timestamp_micros - b.timestamp_micros;
	}
    });

};



/*
 * utility functions
 */

function combinedOrderQuantity(orders) {
    var quantity = 0;
    $.each(orders, function(i, order) {
	quantity += displayQuantity(order);
    });
    return quantity;
}


function isBestOrder(order, orderList) {
    var bestOrder = false;
    if (orderList.length == 0) {
	bestOrder = true;
    }
    else if (order['side'] == 'buy') {
	bestOrder = order.price >= orderList[0].price; 
    }
    else if (order['side'] == 'sell') {
	bestOrder = order.price <= orderList[orderList.length - 1].price; 
    }
    return bestOrder;
}

function displayQuantity(order) {
    return order.quantity;
}