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
	this.chartModel = new ChartModel(0);
	this.mode = 'test';
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
    tradingScreen.exchange.marketSnapshot(function() { 
		tradingScreen.drawOrderGrid();
		setInterval(function() { tradingScreen.repaintChart(); }, 100);
	});
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
	if (tradingScreen.mode == 'test')
	{
		tradingScreen.generateRandomOrders();
	}
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

	$td.find('.show_detail').click(function() { 
		tradingScreen.showDetail(itemId); 
		delete tradingScreen.chartModel;  
		tradingScreen.chartModel = new ChartModel(itemId);
		tradingScreen.chartModel.add(tradingScreen.exchange.getMostRecentTradePrice(itemId), itemId);
	});
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

	tradingScreen.chartModel.add(tradingScreen.exchange.getMostRecentTradePrice(itemId), itemId);
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

    //for (var rowid = product.orders.offers.length - 10; rowid < product.orders.offers.length; rowid++)
	var count = (product.orders.offers.length > 10) ? (10) : (product.orders.offers.length);
	for (var rowid = 0; rowid < count; rowid++)
    {
		var offer = product.orders.offers[rowid];
		tradingScreen.drawDetailRow(rowid+"_"+productId);
		tradingScreen.fillDetailRow(rowid+"_"+productId,
					  {product: tradingScreen.exchange.getSymbol(productId),
					   bid_quantity: '',
					   bid: '',
					   offer: offer.price,
					   offer_quantity: displayQuantity(offer)},
					 productId);
    }

    //for (var rowid1 = product.orders.bids.length - 1; rowid1 >= product.orders.bids.length - 10; rowid1--)
	count = (product.orders.bids.length > 10) ? (10) : (product.orders.bids.length);
	for (var rowid1 = 0; rowid1 < count; rowid1++)
	{
		rowid++;
		var bid = product.orders.bids[rowid1];

		tradingScreen.drawDetailRow(rowid+"_"+productId);
		tradingScreen.fillDetailRow(rowid+"_"+productId,
					  {product: tradingScreen.exchange.getSymbol(productId),
					   bid_quantity: displayQuantity(bid),
					   bid: bid.price,
					   offer: '',
					   offer_quantity: ''},
					 productId);
    }
	
	$(tradingScreen.orderGrid).find('tr').each(function(){
		$(this).removeClass('selected');
	});
	$(tradingScreen.orderGrid).find('#product_row_' + productId).addClass('selected');

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

    var productId = tradingScreen.orderForm.find('select[name=symbol] option:selected').val();
    var side = tradingScreen.orderForm.find('select[name=side] option:selected').val();
    var quantity = tradingScreen.orderForm.find('input[name=quantity]').val();
    var price = tradingScreen.orderForm.find('input[name=price]').val();

	if (price <= 0 || price * 1000 % 10 != 0)
	{
		tradingScreen.orderForm.find('input[name=price]').css('color', '#FF0000');
		return false;
	}

	tradingScreen.orderForm.addClass("loading");
    tradingScreen.exchange.placeOrder(productId, side, quantity, price, function(result, messages) {
		tradingScreen.orderForm.find("input[type=text]").val("");
		tradingScreen.orderForm.removeClass("loading");
		if (result == "error") {  
		}
    });
};
    
/*
 * Generate orders randomly every 1 sec for market
 */
TradingScreen.prototype.generateRandomOrders = function() {
    var tradingScreen = this;	

	var oldOrder = {};
	var gen_order = function() {	
		if (tradingScreen.exchange.connected)
		{
			var products = tradingScreen.exchange.products;
			var isCross = 0;
			if (oldOrder['productId'])
			{
				var sideKey1 = (oldOrder['side'] == 'buy') ? ('bids') :('offers');
				if (products[oldOrder['productId']]['orders'][sideKey1].length > 8)
				{
					isCross = 1;
				}
			}
			if (isCross == 1)
			{
				var productId = oldOrder['productId'];
				var side = (oldOrder['side'] == 'buy') ? ('sell') : ('buy');
				var qty = oldOrder['qty'];
				var price = oldOrder['price'];
				oldOrder = {};
			}
			else
			{
				var randProd = null;
				var prodCount = 0;
				var arrProd = new Array();
				for (productId in products)
				{
					arrProd[prodCount] = products[productId];
					prodCount++;
				}
				var randProd = null;
				var randomKey = Math.floor(Math.random() * prodCount);
				randProd = arrProd[randomKey];
				
				var side = (Math.floor(Math.random() * 2) == 0) ? ('buy') : ('sell');
				var sideKey = (side == 'buy') ? ('bids') :('offers');
				var percentPrice = (Math.floor(Math.random() * 100) % 2 == 0) ? (0.9) : (1.1);
				var percentQty = (Math.floor(Math.random() * 100) % 2 == 0) ? (0.5) : (1.5);

				var price = 100, qty = 100;

				if (randProd['orders'][sideKey].length > 0)
				{
					var lastOrder = randProd['orders'][sideKey][randProd['orders'][sideKey].length - 1];
					price = (lastOrder.price != 0) ? (lastOrder.price) : (price);
					qty = (lastOrder.quantity != 0) ? (lastOrder.quantity) : (qty);
				}

				var productId = randProd.id;
				qty = Math.round((qty + 5) * percentQty);
				price = roundNumber((price + 10) * percentPrice, 2);

				//alert(side + '---'  + Math.floor(qty * percentQty) + '---'  + Math.floor(price * percentPrice));
				oldOrder['productId'] = productId;
				oldOrder['side'] = side;
				oldOrder['qty'] = qty;
				oldOrder['price'] = price;
			}

			tradingScreen.exchange.placeOrder(productId, side, qty, price, function(){
				setTimeout(gen_order, 1000);
			});
		}
    }

	setTimeout(gen_order, 1000);
    
};

function roundNumber(num, dec) {
	var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
	return result;
}

/*
 * Get chart container
 */
TradingScreen.prototype.getChartDiv = function() {
    return document.getElementById("chart");    
};

/*
 * Repaint the chart
 */
TradingScreen.prototype.repaintChart = function() {

	var tradingScreen = this;
	var divTag = document.createElement("div");
	var axisY = AXIS_Y_WIDTH;

	if (chart)
	{
		axisY = chart._axisY;
		chart.dispose();
		delete chart;
	}
	axisY--;
	chart = new ChartWidget(divTag, 350, 240, axisY);

	//chart.data("Live bid price", sellHistory, SELL_COLOR);
	//chart.data("Live ask price", buyHistory, BUY_COLOR);

	tradingScreen.getChartDiv().replaceChild(divTag, tradingScreen.getChartDiv().firstChild);

	if (tradingScreen.detailProduct)
	{
		tradingScreen.chartModel.update();
	}

	chart.render(tradingScreen.chartModel);
};

