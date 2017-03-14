var KeyboardShortcutHelpController = Composer.Controller.extend({
	modal: null,

	init: function() {
		this.modal = new TurtlModal({
			show_header: true,
			title: i18next.t('Keyboard shortcuts')
		});

		this.render();

		console.log('hellp');
		var close = this.modal.close.bind(this.modal);
		this.modal.open(this.el);
		this.with_bind(this.modal, 'close', this.release.bind(this));
		this.bind(['cancel', 'close'], close);
	},

	render: function() {
		this.html(view.render('help/bindings'));
	},
});

