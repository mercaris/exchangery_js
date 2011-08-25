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

		this._draw_horizontal_lines(renderer, model);
		this._draw_vertical_lines(renderer, model);
		this._draw_data_lines(renderer, model);

		renderer.dispose();
	},

	_draw_vertical_lines: function(renderer, model)
	{
		for (var x = this._axisY; x < this._columns - 80; x = x + AXIS_Y_WIDTH)
		{
			renderer.stroke = GRID_LINES_COLOR;
			renderer.stroke_width = 1;
			renderer.line(x, 0, x, this._rows);
		}

		renderer.stroke = COLUMN_DIVIDER;
		renderer.stroke_width = 1;
		renderer.line(270, 0, 270, this._rows);
	},

	_draw_horizontal_lines: function(renderer, model)
	{
		for (var y = AXIS_X_HEIGHT; y <= this._rows; y = y + AXIS_X_HEIGHT)
		{
			renderer.stroke = GRID_LINES_COLOR;
			renderer.stroke_width = 1;
			renderer.line(0, y, this._columns, y);

			if (model._data.length > 0)
			{
				renderer.fill = FOREGROUND_COLOR;
				renderer.stroke = 'transparent';
				renderer.gravity = 'west';
				renderer.annotate(280, y - 15, roundNumber(y / AXIS_X_HEIGHT * model._baseY / 4, 2));
			}
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

	annotate: function(x, y, content)
	{
		if (this._ctx.fillText)
		{
			this._ctx.strokeStyle = this.stroke;
			this._ctx.lineWidth = this.stroke_width;
			this._ctx.font = "12px Arial";
			this._ctx.fillStyle = this.fill;
			this._ctx.fillText(content, x, y + 5);
		}
		else
		{
			var textNode = document.createElement('div');
			// Absolute positioned elements don't appear in IE in this context
			// so use relative position and offset to fit in the right place.
			textNode.style.position = 'relative';
			textNode.style.textAlign = 'center';
			textNode.style.left = (x - 110) + 'px';
			textNode.style.top = (y - 240) + 'px';
			textNode.innerHTML = content;
			document.getElementById('current-canvas').parentNode.appendChild(textNode);
		}
	},

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
		if (this._pid != pid || price <= 0)
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
		if (this._data.length == 0)
			return;

		this._data[this._data.length] = this._data[this._data.length - 1];

		this.arrange();
	},
	arrange: function() {
		if (this._data.length > 270)
			this._data.splice(0, this._data.length - 270);
	}
}
