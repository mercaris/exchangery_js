/*
 * Constructor for a client to an Exchangery exchange. Takes a market id (String) as an argument.
 */
function ProductScreen(marketId, templateGridId, formCanvasId, instructionId) {
    
    // data
    this.marketId = marketId;
    this.productTemplates = [];
    this.productTemplate;          // current template
    this.products = {};
    this.instructions = getInstructions();

    // display
    this.templateGrid = $('#' + templateGridId);
    this.formCanvas = $('#' + formCanvasId);
    this.templateListId = templateGridId + '_ul';
    this.instruction = $('#' + instructionId);

    // utility
    this.fetching = false;
    this.authenticated = false;
    this.productUpdateListeners = [];

    // load templates and draw menu
    this.fetchTemplates();
}

/*
 * Get the templates from the server
 */
ProductScreen.prototype.fetchTemplates = function() {
    var productScreen = this;

    $.ajax({
	type: 'GET',
	url: '/admin/market/' + productScreen.marketId + '/product_templates', 
	contentType: 'application/json; charset=utf-8', 
	dataType: 'json',
	//processData : false,
	success: function(data) {	    
	    productScreen.productTemplates = data.product_templates;
	    productScreen.drawTemplates();
	    productScreen.clearCanvas();
	}
    });
};

/*
 * Draw the template portion of the navigation/menu
 */
ProductScreen.prototype.drawTemplates = function() {
    var productScreen = this;

    productScreen.templateGrid.html('');
    productScreen.templateGrid.html("<ul id='" + productScreen.templateListId + "' class='nav_box'></ul>");

    var templateList = $('#' + productScreen.templateListId);
       
    $.each(productScreen.productTemplates, function(i, template) {

	var name = template.name;
	var id = template.id;
	templateList.append("<li><a id='" + id + "' class='template_button'>" + name + "</a></li>");
    });
    $('.template_button').click(function() {	
	var id = $(this).attr('id');
	console.log(id);
	productScreen.createProductTemplateUpdateForm(id);
    }); 

    productScreen.templateGrid.append("<input id='new_template_button' type='submit' name='submit' value='(+) new template' class='button'>");
    $('#new_template_button').click(function() {
	productScreen.drawNewProductTemplateForm();
    }); 

    productScreen.instruction.html(productScreen.instructions.template);
};

/*
 * Draw the template portion of the navigation/menu
 */
ProductScreen.prototype.clearCanvas = function() {
    var productScreen = this;
       
    productScreen.formCanvas.html('');
};

/*
 * Draw the template form for an existing product
 */
ProductScreen.prototype.createProductTemplateUpdateForm = function(templateId) {
    var productScreen = this;

    $.ajax({
	type: 'GET',
	url: '/admin/market/' + productScreen.marketId + '/product_templates/' + templateId, 
	contentType: 'application/json; charset=utf-8', 
	dataType: 'json',
	//processData : false,
	success: function(data) {	    
	    productScreen.productTemplate = data.product_template;
	    productScreen.drawProductTemplateForm();
	}
    });
};
/*
 * Draw the template form for an existing product
 */
ProductScreen.prototype.drawProductTemplateUpdateForm = function() {
    var productScreen = this;

    
    var html = "<form id='product_template_form'>" +
	"<h3>Template</h3>" + 
	"<label for='product_template_form_name'>name</label>" +
        "<input type='text' name='product_template_form_name' value='" + productScreen.productTemplate.name + "'>" +
	"<input type='submit' name='submit' value='save' class='button'>" + 
	"<br/></form>";
    productScreen.formCanvas.html(html);

    productScreen.instruction.html(productScreen.instructions.update_template);

    $('#product_template_form').submit(function() {
	requestData = { product_template : 
			{ name: $('[name=product_template_form_name]').val() }
		      };	
	$(this).addClass("loading");
	$.ajax({
	    type: 'POST',
	    url: '/admin/market/' + productScreen.marketId + '/product_templates' + productScreen.productTemplate.id, 
	    contentType: 'application/json; charset=utf-8', 
	    dataType: 'json',
	    //processData : false,
	    data: JSON.stringify(requestData),
	    success: function(data) {
		alert("Thank you!");
		$(this).removeClass("loading");
		//$('[name=product_template_form_name]').val("");
		productScreen.fetchTemplates();
	    }
	});
	
	return false;
    });
};

/*
 * Draw the template form for a new product
 */
ProductScreen.prototype.drawNewProductTemplateForm = function() {
    var productScreen = this;
       
    var html = "<form id='new_product_template_form'>" +
	"<h3>Template</h3>" + 
	"<label for='new_product_template_form_name'>name</label>" +
        "<input type='text' name='new_product_template_form_name'>"+
	"<input type='submit' name='submit' value='save' class='button'>" + 
	"<br/></form>";
    productScreen.formCanvas.html(html);

    productScreen.instruction.html(productScreen.instructions.new_template);

    $('#new_product_template_form').submit(function() {
	requestData = { product_template : 
			{ name: $('[name=new_product_template_form_name]').val() }
		      };	
	$(this).addClass("loading");
	$.ajax({
	    type: 'POST',
	    url: '/admin/market/' + productScreen.marketId + '/product_templates', 
	    contentType: 'application/json; charset=utf-8', 
	    dataType: 'json',
	    //processData : false,
	    data: JSON.stringify(requestData),
	    success: function(data) {
		alert("Thank you!");
		$(this).removeClass("loading");
		$('[name=new_product_template_form_name]').val("");
		productScreen.fetchTemplates();
	    }
	});
	
	return false;
    });
};


function getInstructions() {

    var inst = { 
	template : 'Product templates represent a category of products. Choose a template from the list to the left, or create a new one.',
	new_template : 'Product templates represent a category of products. Enter a name for the template.',
	update_template : 'After making changes to the template be sure to save.',
	product : 'Products are what will be listed on the trading screen, made up of a commodity and a contract. Choose a product from the list to the left, or create a new one.'
    };
    return inst;
}
/*
var lastSelected = $("#products");
var lastClicked = $("#products_select");
function reveal(selected){
    lastSelected.css('visibility','hidden').css('display','none'); 
    selected.css('visibility','visible').css('display','block');
    lastSelected = selected;
}
function navOn(clicked) {
    lastClicked.removeClass("navOn");
    clicked.addClass("navOn");
    lastClicked = clicked;
}



*/