var NoteViewController = Composer.Controller.extend({
	className: 'note-view notes content',

	elements: {
		'ul.dropdown': 'dropdown_menu'
	},

	events: {
		'click .actions a.menu': 'open_menu',
		'mouseleave ul.dropdown': 'close_menu',
		'mouseenter ul.dropdown': 'cancel_close_menu',
		'click ul.dropdown a.edit': 'open_edit',
		'click ul.dropdown a.move': 'open_move',
		'click ul.dropdown a.delete': 'delete_note',
		'click a.attachment': 'download_attachment'
	},

	model: null,
	board: null,
	menu_close_timer: null,

	init: function()
	{
		if(!this.model) return false;

		this.render();
		modal.open(this.el);
		modal.objects.container.addClass('bare');
		var modalclose = function() {
			modal.objects.container.removeClass('bare');
			modal.removeEvent('close', modalclose);
			this.release();
		}.bind(this);
		modal.addEvent('close', modalclose);

		this.model.bind('change', this.render.bind(this), 'note:view:render');
		this.model.bind('destroy', this.release.bind(this), 'note:view:destroy');
		turtl.keyboard.bind('e', this.open_edit.bind(this), 'notes:view:shortcut:edit_note');
		turtl.keyboard.bind('m', this.open_move.bind(this), 'notes:view:shortcut:move_note');
		turtl.keyboard.bind('delete', this.delete_note.bind(this), 'notes:view:shortcut:delete_note');

		this.menu_close_timer		=	new Timer(200);
		this.menu_close_timer.end	=	this.do_close_menu.bind(this);
	},

	release: function()
	{
		if(modal.is_open) modal.close();
		this.model.unbind('change', 'note:view:render');
		this.model.unbind('destroy', 'note:view:destroy');
		turtl.keyboard.unbind('e', 'notes:view:shortcut:edit_note');
		turtl.keyboard.unbind('m', 'notes:view:shortcut:move_note');
		turtl.keyboard.unbind('delete', 'notes:view:shortcut:delete_note');
		this.menu_close_timer.end	=	null;
		this.parent.apply(this, arguments);
	},

	render: function()
	{
		var note_data	=	toJSON(this.model);
		if(!note_data.text && !note_data.url && !note_data.embed && note_data.file && note_data.file.blob_url && note_data.file.type.match(/^image/))
		{
			note_data.type	=	'image';
			note_data.url	=	note_data.file.blob_url;
			note_data.file.blob_url	=	null;
		}
		var content = Template.render('notes/view/index', {
			note: note_data
		});
		content = view.make_links(content);
		this.html(content);
		this.el.className = 'note-view notes content '+note_data.type;
	},

	open_menu: function(e)
	{
		if(e) e.stop();
		this.dropdown_menu.addClass('open');
	},

	do_close_menu: function()
	{
		this.dropdown_menu.removeClass('open');
	},

	close_menu: function(e)
	{
		this.menu_close_timer.start();
	},

	cancel_close_menu: function(e)
	{
		this.menu_close_timer.stop();
	},

	open_edit: function(e)
	{
		if(e) e.stop();
		this.release();
		new NoteEditController({
			board: this.board,
			note: this.model
		});
	},

	open_move: function(e)
	{
		if(e) e.stop();
		new NoteMoveController({
			board: this.board,
			note: this.model
		});
	},

	delete_note: function(e)
	{
		if(e) e.stop();
		if(confirm('Really delete this note FOREVER?!'))
		{
			turtl.loading(true);
			this.model.destroy({
				success: function() { turtl.loading(false); },
				error: function(_, err) {
					turtl.loading(false);
					barfr.barf('There was a problem deleting the note: '+ err);
				}
			});
		}
	},

	download_attachment: function(e)
	{
		if(e) e.stop();
		var win	=	window.open('data:text/html;base64,'+convert.base64.encode('<center><br><br><strong>Decrypting file, please wait.</strong></center>'));
		this.model.get('file').to_blob({
			success: function(blob) {
				var url	=	URL.createObjectURL(blob);
				win.location	=	url;
				var monitor		=	function()
				{
					if(win.closed)
					{
						URL.revokeObjectURL(url);
						return false;
					}
					monitor.delay(100, this);
				};
				monitor();
			}
		});
	}
});
