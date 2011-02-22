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
$(document).ready(function(){
    $("#products_select").click(function(){navOn($(this)); reveal($("#products"));});
    $("#accounts_select").click(function(){navOn($(this)); reveal($("#accounts"));});
    $("#risk_select").click(function(){navOn($(this)); reveal($("#risk"));});
    $("#trading_select").click(function(){navOn($(this)); reveal($("#trading"));});
    navOn($("#products_select"));
    reveal($("#products"));
});