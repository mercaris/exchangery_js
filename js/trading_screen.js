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
TradingScreen.prototype.drawRow = function(productId) {
    var tradingScreen = this;

    var $tr = $('<tr></tr>');
    var trid = 'product_row_' + productId;
    $tr.css('id', trid);
    var add_cell = function (i, name) {
	var $td = $('<td></td>');
	var tdid = name + '_cell_' + productId;
	$td.attr('id', tdid);
	$tr.append($td);
    };
    $.each(['product', 'bid_quantity', 'bid', 'offer', 'offer_quantity'], add_cell);
    tradingScreen.gridTable.append($tr);
    tradingScreen.fillRow(productId);
};

/*
 * fill in the cells for a product
 */
TradingScreen.prototype.fillRow = function(productId) {
    var tradingScreen = this;

    var fill_cell = function (i, details) {
	var name = details[0];
	var val = details[1];
	var tdid = name + '_cell_' + productId;
	var $td = $('#' + tdid);
	$td.html(val);
    };
    $.each([
	['product', tradingScreen.exchange.getSymbol(productId)],
	['bid_quantity', tradingScreen.exchange.getBestBidQuantity(productId)],
	['bid', tradingScreen.exchange.getBestBidPrice(productId)],
	['offer', tradingScreen.exchange.getBestOfferPrice(productId)],
	['offer_quantity', tradingScreen.exchange.getBestOfferQuantity(productId)]
    ], fill_cell);
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
    

