/*
 * Constructor for a Trading Screen
 */
function TradingScreen(gridId, orderFormId, detailPaneId) {
    this.orderGrid = $('#' + gridId);
	this.orderGrid.find('tbody').html('');
    this.orderForm = $('#' + orderFormId);
    this.detailPane = $('#' + detailPaneId);
    this.detailGrid;
    this.detailProduct; // string, not jquery object
    this.detailSymbol;
    this.symbolDropdown = $('#' + orderFormId + ' [name=symbol]');
    this.exchange = null;
};

/*
 * Before any other actions can take place, the exchange client must log in with a valid username and password (Strings)
 */
TradingScreen.prototype.connect = function(marketId, username, password) {
    var tradingScreen = this;
    tradingScreen.exchange = new ExchangeClient(marketId);
    tradingScreen.exchange.login(username, password, function() { $.fancybox.close(); tradingScreen.initMarket(); });
};

/*
 * call the market snapshot method to initialize the market data
 */
TradingScreen.prototype.initMarket = function () {
    var tradingScreen = this;
    tradingScreen.exchange.marketSnapshot(function() { tradingScreen.drawOrderGrid(); });
};

/*
 * draw the order grid
 */
TradingScreen.prototype.drawOrderGrid = function() {
    var tradingScreen = this;

    $.each(tradingScreen.exchange.getProductIds(), function(i, productId) {
	tradingScreen.drawSummaryRow(productId);
	tradingScreen.fillSummaryRow(productId);

	var symbol = tradingScreen.exchange.getSymbol(productId);
	tradingScreen.symbolDropdown.append(
	    $('<option value=' + productId + '></option>').text(symbol));
    });

    tradingScreen.exchange.registerBestOrderUpdateListener(tradingScreen, tradingScreen.fillSummaryRow);
    tradingScreen.exchange.registerProductUpdateListener(tradingScreen, tradingScreen.notifyOfProductUpdate);
	tradingScreen.exchange.registerRecentTradeUpdateListener(tradingScreen, tradingScreen.fillSummaryRow);
    tradingScreen.wireOrderForm();
    tradingScreen.beginPolling();
};

/*
 * draw a row for each product, with empty cells
 */
TradingScreen.prototype.drawSummaryRow = function(itemId) {
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
    $.each(['product', 'bid_quantity', 'bid', 'offer', 'offer_quantity', 'last_price', 'last_price_arrow'], add_cell);
    tradingScreen.orderGrid.append($tr);
};


/*
 * fill in the cells for a product
 */
TradingScreen.prototype.fillSummaryRow = function(itemId, data) {
    var tradingScreen = this;

    var fill_cell = function (name, value) {
	var value = (name == 'product') ? "<div class='show_detail pseudo_link'>" + value + "</div>" : value;
	var tdid = name + '_cell_' + itemId;
	var $td = $('#' + tdid);
	$td.html(value);

	$td.find('.show_detail').click(function () { tradingScreen.showDetail(itemId) });
	if (name == 'last_price_arrow') {
		$('#' + name + '_cell_' + itemId + ' img').show().delay(1500).fadeOut();
	}
	
    };

    data = data || {product: tradingScreen.exchange.getSymbol(itemId),
		    bid_quantity: tradingScreen.exchange.getBestBidQuantity(itemId),
		    bid: tradingScreen.exchange.getBestBidPrice(itemId),
		    offer: tradingScreen.exchange.getBestOfferPrice(itemId),
		    offer_quantity: tradingScreen.exchange.getBestOfferQuantity(itemId),
			last_price: tradingScreen.exchange.getMostRecentTradePrice(itemId),
			last_price_arrow: tradingScreen.exchange.getMostRecentTradePriceArrow(itemId)};

    $.each(data, fill_cell);
};

/*
 * draw the order grid
 */
TradingScreen.prototype.drawDetailPaneSkeleton = function() {
    var tradingScreen = this;
    
    var detailSymbolId = 'detail_product_symbol';
    var $symbol = $("<div id='" + detailSymbolId + "'></div>");
    tradingScreen.detailPane.append($symbol);

    var detailGridId = 'detail_grid';
    var detailHtml = "<table id='" + detailGridId + "' >" 
	+ "<thead><tr>"
	+ "<td width='25%'>bid quantity</td>"
	+ "<td width='25%'>bid</td>"
	+ "<td width='25%'>offer</td>" 
	+ "<td width='25%'>offer quantity</td>"
	+ "</tr></thead>"
	+ "<tbody></tbody>" 
	+ "</table>";
    var $detailGrid = $(detailHtml);
    tradingScreen.detailPane.append($detailGrid);

    tradingScreen.detailGrid = $('#' + detailGridId);
    tradingScreen.detailSymbol = $('#' + detailSymbolId);
};

/*
 * show a table with expand order rows to display more bids
 */
TradingScreen.prototype.notifyOfProductUpdate = function (productId) {
    var tradingScreen = this;

    if (tradingScreen.detailProduct == productId) {
	tradingScreen.showDetail(productId);
    }
};

/*
 * show a table with expand order rows to display more bids
 */
TradingScreen.prototype.showDetail = function (productId) {
    var tradingScreen = this;
    
    var product = tradingScreen.exchange.getProduct(productId);
    tradingScreen.detailProduct = productId;

    tradingScreen.resetDetailPane();
    tradingScreen.drawDetailPaneSkeleton();

    tradingScreen.detailSymbol.append(tradingScreen.exchange.getSymbol(productId));

    var $table = tradingScreen.detailGrid.find('tbody');

    $.each(product.orders.offers, function (rowid, offer) {
	tradingScreen.drawDetailRow(rowid+"_"+productId);
	tradingScreen.fillDetailRow(rowid+"_"+productId,
			      {product: tradingScreen.exchange.getSymbol(productId),
			       bid_quantity: '',
			       bid: '',
			       offer: offer.price,
			       offer_quantity: displayQuantity(offer)},
			     productId);
    });

    $.each(product.orders.bids, function (rowid, bid) {
	rowid += product.orders.offers.length;

	tradingScreen.drawDetailRow(rowid+"_"+productId);
	tradingScreen.fillDetailRow(rowid+"_"+productId,
			      {product: tradingScreen.exchange.getSymbol(productId),
			       bid_quantity: displayQuantity(bid),
			       bid: bid.price,
			       offer: '',
			       offer_quantity: ''},
			     productId);
    });
    return false;
}

TradingScreen.prototype.resetDetailPane = function () {
    var tradingScreen = this;

    tradingScreen.detailPane.html("");
}

/*
 * draw a row for each product, with empty cells
 */
TradingScreen.prototype.drawDetailRow = function(itemId) {
    var tradingScreen = this;

    var $tr = $('<tr></tr>');
    var trid = 'detail_product_row_' + itemId;
    $tr.attr('id', trid);
    var add_cell = function (i, name) {
	var $td = $('<td></td>');
	var tdid = name + '_detail_cell_' + itemId;
	$td.attr('id', tdid);
	$tr.append($td);
    };
    $.each(['bid_quantity', 'bid', 'offer', 'offer_quantity'], add_cell);
    tradingScreen.detailGrid.append($tr);
};

/*
 * fill in the cells for a product
 */
TradingScreen.prototype.fillDetailRow = function(itemId, data) {
    var tradingScreen = this;

    var fill_cell = function (name, value) {
	var tdid = name + '_detail_cell_' + itemId;
	var $td = $('#' + tdid);
	$td.html(value);	
    };
/*
    data = data || {product: tradingScreen.exchange.getSymbol(itemId),
		    bid_quantity: tradingScreen.exchange.getBestBidQuantity(itemId),
		    bid: tradingScreen.exchange.getBestBidPrice(itemId),
		    offer: tradingScreen.exchange.getBestOfferPrice(itemId),
		    offer_quantity: tradingScreen.exchange.getBestOfferQuantity(itemId)};
*/
    $.each(data, fill_cell);
};


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
    

