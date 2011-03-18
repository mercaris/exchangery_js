/*
 * Constructor for a Trading Screen
 */
function TradingScreen(gridId, orderFormId) {
    this.gridTable = $('#' + gridId);
    this.orderForm = $('#' + orderFormId);
    this.symbolDropdown = $('#' + orderFormId + ' [name=symbol]');
    this.exchange = null;
};

/*
 * Before any other actions can take place, the exchange client must log in with a valid username and password (Strings)
 */
TradingScreen.prototype.connect = function(marketId, username, password) {
    var tradingScreen = this;
    tradingScreen.exchange = new ExchangeClient(marketId);
    tradingScreen.exchange.login(username, password, 
				 function() {
				     tradingScreen.initMarket(); 
				 });
};

/*
 * call the market snapshot method to initialize the market data
 */
TradingScreen.prototype.initMarket = function () {
    var tradingScreen = this;
    tradingScreen.exchange.marketSnapshot(function() { tradingScreen.drawGrid(); });
};

/*
 * draw the order grid
 */
TradingScreen.prototype.drawGrid = function() {
    var tradingScreen = this;

    $.each(tradingScreen.exchange.getProductIds(), function(i, productId) {
	tradingScreen.drawRow(productId);
	tradingScreen.fillRow(productId);
	tradingScreen.exchange.registerBestOrderUpdateListener(tradingScreen, tradingScreen.fillRow);

	var symbol = tradingScreen.exchange.getSymbol(productId);
	tradingScreen.symbolDropdown.append(
	    $('<option value=' + productId + '></option>').text(symbol));
    });

    tradingScreen.wireOrderForm();
    tradingScreen.beginPolling();
};

/*
 * draw a row for each product, with empty cells
 */
TradingScreen.prototype.drawRow = function(itemId) {
    var tradingScreen = this;

    var $tr = $('<tr></tr>');
    var trid = 'product_row_' + itemId;
    $tr.attr('id', trid);
    var add_cell = function (i, name) {
	var $td = $('<td></td>');
	var tdid = name + '_cell_' + itemId;
	$td.attr('id', tdid);
	$tr.append($td);
    };
    $.each(['product', 'bid_quantity', 'bid', 'offer', 'offer_quantity'], add_cell);
    tradingScreen.gridTable.append($tr);
};

/*
 * fill in the cells for a product
 */
TradingScreen.prototype.fillRow = function(itemId, data, expanded) {
    var tradingScreen = this;

    var fill_cell = function (name, value) {
	var value = (name == 'product') ? '<a href="#">'+value+'</a>' : value;
	var tdid = name + '_cell_' + itemId;
	var $td = $('#' + tdid);
	$td.html(value);
	if (!expanded) {
	    $td.find('a').click(function () { tradingScreen.expandRow(itemId) });
	}else{
	    $td.find('a').click(function () { tradingScreen.closeRow(expanded) });
	}
    };

    data = data || {product: tradingScreen.exchange.getSymbol(itemId),
		    bid_quantity: tradingScreen.exchange.getBestBidQuantity(itemId),
		    bid: tradingScreen.exchange.getBestBidPrice(itemId),
		    offer: tradingScreen.exchange.getBestOfferPrice(itemId),
		    offer_quantity: tradingScreen.exchange.getBestOfferQuantity(itemId)};

    $.each(data, fill_cell);
};

/*
 * expand a product row to display more bids
 */
TradingScreen.prototype.expandRow = function (productId) {
    var tradingScreen = this;
    
    var product = tradingScreen.exchange.getProduct(productId);
    product.sortOrders();

    tradingScreen.resetGrid();

    var $table = tradingScreen.gridTable.find('tbody');

    $.each(product.orders.offers, function (rowid, offer) {
	tradingScreen.drawRow(rowid+"_"+productId);
	tradingScreen.fillRow(rowid+"_"+productId,
			      {product: tradingScreen.exchange.getSymbol(productId),
			       bid_quantity: '',
			       bid: '',
			       offer: offer.price,
			       offer_quantity: offer.quantity},
			     productId);
    });

    $.each(product.orders.bids, function (rowid, bid) {
	rowid += product.orders.offers.length;

	tradingScreen.drawRow(rowid+"_"+productId);
	tradingScreen.fillRow(rowid+"_"+productId,
			      {product: tradingScreen.exchange.getSymbol(productId),
			       bid_quantity: bid.quantity,
			       bid: bid.price,
			       offer: '',
			       offer_quantity: ''},
			     productId);
    });
}

TradingScreen.prototype.closeRow = function () {
    var tradingScreen = this;

    tradingScreen.resetGrid();
    tradingScreen.drawGrid();
}

TradingScreen.prototype.resetGrid = function () {
    var tradingScreen = this;

    tradingScreen.gridTable.find('tbody').html("");
}

/*
 * Poll the market for updates
 */
TradingScreen.prototype.beginPolling = function() {
    var tradingScreen = this;
    tradingScreen.exchange.marketUpdate(function() { });
};

/*
 * Set jQuery form submission listener for order form
 */
TradingScreen.prototype.wireOrderForm = function() {
    var tradingScreen = this;

    tradingScreen.orderForm.submit(function(event) {
	event.preventDefault();

	if (tradingScreen.orderForm.hasClass("loading")) return;

	tradingScreen.placeOrder();
    });
};

/*
 * Handle an order submit
 */
TradingScreen.prototype.placeOrder = function() {
    var tradingScreen = this;

    tradingScreen.orderForm.addClass("loading");

    var productId = tradingScreen.orderForm.find('select[name=symbol] option:selected').val();
    var side = tradingScreen.orderForm.find('select[name=side] option:selected').val();
    var quantity = tradingScreen.orderForm.find('input[name=quantity]').val();
    var price = tradingScreen.orderForm.find('input[name=price]').val();

    tradingScreen.exchange.placeOrder(productId, side, quantity, price, function(result, messages) {
	tradingScreen.orderForm.find("input[type=text]").val("");
	tradingScreen.orderForm.removeClass("loading");
	if (result == "error") {
	    
	}
    });
};
    

