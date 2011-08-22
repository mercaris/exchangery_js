function ChartWidget(parentTag, columns, rows, axisY)
{
	var canvasTag = document.createElement("canvas");
	canvasTag.width = columns;
	canvasTag.height = rows;
	canvasTag.id = 'current-canvas';
	parentTag.appendChild(canvasTag);
	if (window.G_vmlCanvasManager)
	{
		G_vmlCanvasManager.initElement(canvasTag);
	}

	this._columns = columns;
	this._rows = rows;
	this._axisY = axisY % AXIS_Y_WIDTH;
}

ChartWidget.prototype = {

	render: function(model)
	{
		var renderer = new Renderer(document.getElementById('current-canvas'));

		this._draw_horizontal_lines(renderer);
		this._draw_vertical_lines(renderer);
		this._draw_data_lines(renderer, model);

		renderer.dispose();
	},

	_draw_vertical_lines: function(renderer)
	{
		for (var x = this._axisY; x < this._columns; x = x + AXIS_Y_WIDTH)
		{
			renderer.stroke = GRID_LINES_COLOR;
			renderer.stroke_width = 1;
			renderer.line(x, 0, x, this._rows);
		}
	},

	_draw_horizontal_lines: function(renderer)
	{
		for (var y = AXIS_X_HEIGHT; y < this._rows; y = y + AXIS_X_HEIGHT)
		{
			renderer.stroke = GRID_LINES_COLOR;
			renderer.stroke_width = 1;
			renderer.line(0, y, this._columns, y);
		}
	},

	_draw_data_lines: function (renderer, model)
	{
		var data = model._data;
		if (data.length > 0)
		{
			renderer.stroke = PRICE_LINES_COLOR;
			renderer.stroke_width = 2;

			for (var i=0; i<data.length; i++)
			{		
				var y = 240 - data[i] / model._baseY * 120;
				var x = i + 270 - data.length;
				if (i == 0) {
					renderer.line(x, y, x, y);
				} else if (i > 0) {
					var _y = 240 - data[i - 1] / model._baseY * 120;
					var _x = (i - 1) + 270 - data.length;
					renderer.line(_x, _y, x, y);
				}
			}
		}
	},
	dispose: function()
	{
	}
};


function Renderer(canvas)
{
	this._ctx = canvas.getContext('2d');
}

Renderer.prototype = {

	line: function(sx, sy, ex, ey)
	{
		this._ctx.strokeStyle = this.stroke;
		this._ctx.lineWidth = this.stroke_width;
		this._ctx.beginPath();
		this._ctx.moveTo(sx, sy);
		this._ctx.lineTo(ex, ey);
		this._ctx.stroke();
	},

	dispose: function()
	{
		if (this._ctx.dispose)
		{
			this._ctx.dispose();
		}
		this._ctx = null;
		delete this._ctx;
	}
};

function ChartModel(pid)
{
	this._data = [];
	this._pid = pid;
	this._baseY = 120;
}

ChartModel.prototype = {

	clear: function() {
		this._data = [];
	},
	add: function(price, pid) {
		if (this._pid != pid)
			return;

		if (this._data.length == 0)
		{
			this._baseY = price;
			this._data[this._data.length] = price;
		}
		else
			this._data[this._data.length - 1] = price;
		

		this.arrange();
	},
	update: function() {
		this._data[this._data.length] = this._data[this._data.length - 1];

		this.arrange();
	},
	arrange: function() {
		if (this._data.length > 270)
			this._data.splice(0, this._data.length - 270);
	}
}