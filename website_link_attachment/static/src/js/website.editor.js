$(document).ready(function() {
    'use strict';

    var website = openerp.website;
    website.add_template_file('/website_link_attachment/static/src/xml/website.editor.xml');

    var FILES_PER_ROW = 6;
    var FILES_ROWS = 2;

    website.editor.fileDialog = website.editor.Media.extend({
        template: 'website.editor.dialog.file',
        events: _.extend({}, website.editor.Dialog.prototype.events, {
            'click button.filepicker': function() {
                var filepicker = this.$('input[type=file]');
                if (!_.isEmpty(filepicker)) {
                    filepicker[0].click();
                }
            },
            'change input[type=file]': 'file_selection',
            'change input[name=title]': 'rename',
            'submit form': 'form_submit',
            'click .file-existing-attachment-remove': 'try_remove',
            'click .file-existing-attachments span.label': 'select_existing'
        }),
        init: function(parent, editor, media) {
            this.page = 0;
            this._super(parent, editor, media);
        },
        start: function() {
            var self = this;
            var res = this._super();

            this.parent.$(".pager > li").click(function(e) {
                e.preventDefault();
                var $target = $(e.currentTarget);
                if ($target.hasClass('disabled')) {
                    return;
                }
                self.page += $target.hasClass('previous') ? -1 : 1;
                self.display_attachments();
            });

            this.fetch_existing();
            return res;
        },
        save: function() {
            if (!this.att_id || !this.att_name) {
                this.att_id = this.$(".file-existing-attachments label:first").attr('data-id');
                this.att_name = this.$(".file-existing-attachments label:first").text();
            }
            this.media.renameNode("a");
            $(this.media.$).attr('href', '/website/download_file/' + this.att_id);
            $(this.media.$).attr('target', '_blank');
            $(this.media.$).text(this.att_name);
            this._super();
        },
        show_error: function(message){
            this.$('form').parent().html($('<p/>',{
                'class': 'mt16 mb16 alert alert-danger',
                'text': message
            }));
        },
        search: function(needle) {
            var self = this;
            this.fetch_existing(needle);
        },
        cancel: function() {
            this.trigger('cancel');
        },
        file_selection: function() {
            this.$el.addClass('nosave');
            this.$('button.filepicker').removeClass('btn-danger btn-success');
            this.$('form').submit();
        },
        form_submit: function(event) {
            var self = this;
            var $form = this.$('form[action="/website/attach_file"]');
            var callback = _.uniqueId('func_');
            this.$('input[name=func]').val(callback);
            window[callback] = function(att_id, error) {
                delete window[callback];
                self.file_selected(att_id, error);
            };
        },
        file_selected: function(att_id, error) {
            var $button = this.$('button.filepicker');
            if (!error) {
                $button.addClass('btn-success');
            } else {
                att_id = null;
                $button.addClass('btn-danger');
            }
            this.fetch_existing();
        },
        fetch_existing: function(needle) {
            var self = this;
            var domain = [
                ['available_in_editor', '=', true]
            ];
            if (needle && needle.length) {
                domain.push('|', ['datas_fname', 'ilike', needle], ['name', 'ilike', needle]);
            }
            return openerp.jsonRpc('/web/dataset/call_kw', 'call', {
                model: 'ir.attachment',
                method: 'search_read',
                args: [],
                kwargs: {
                    fields: ['name'],
                    domain: domain,
                    order: 'id desc',
                    context: website.get_context(),
                }
            }).then(this.proxy('fetched_existing')).fail(function(e, error){
                self.show_error(error.message);
            });
        },
        fetched_existing: function(records) {
            this.records = records;
            this.display_attachments();
        },
        display_attachments: function() {
            var per_screen = FILES_PER_ROW * FILES_ROWS;

            var from = this.page * per_screen;
            var records = this.records;

            // Create rows of 3 records
            var rows = _(records).chain()
                .slice(from, from + per_screen)
                .groupBy(function(_, index) {
                    return Math.floor(index / FILES_PER_ROW);
                })
                .values()
                .value();

            this.$('.file-existing-attachments').replaceWith(
                openerp.qweb.render(
                    'website.editor.dialog.file.existing.content', {
                        rows: rows
                    }));
            this.parent.$('.pager')
                .find('li.previous').toggleClass('disabled', (from === 0)).end()
                .find('li.next').toggleClass('disabled', (from + per_screen >= records.length));
        },
        try_remove: function(e) {
            var self = this;
            var $a = $(e.target);
            var id = parseInt($a.data('id'), 10);
            var attachment = _.findWhere(this.records, {
                id: id
            });

            if (id == self.att_id) {
                self.$('input[name="title"]').val('').trigger('change');
                self.$('span.file-url').text('');
            }

            return openerp.jsonRpc('/web/dataset/call_kw', 'call', {
                model: 'ir.attachment',
                method: 'try_remove',
                args: [],
                kwargs: {
                    ids: [id],
                    context: website.get_context()
                }
            }).then(function(prevented) {
                if (_.isEmpty(prevented)) {
                    self.records = _.without(self.records, attachment);
                    self.display_attachments();
                    return;
                }
            }).fail(function(e, error){
                self.show_error(error.message);
            });;
        },
        select_existing: function(e) {
            var att_id = $(e.currentTarget).attr('data-id');
            var att_name = $(e.currentTarget).text();
            this.att_id = att_id;
            this.selected_existing(att_id);
        },
        selected_existing: function(id) {
            this.$('.file-existing-attachment-cell .label-success').removeClass("label-success");
            var $select = this.$('.file-existing-attachment-cell span.label').filter(function() {
                return $(this).attr("data-id") == id;
            }).first();
            $select.addClass("label-success");
            this.$('input[name="title"]').val($select.text()).trigger('change');
            this.$('span.file-url').text('/website/download_file/' + id);
            return $select;
        },
        rename: function() {
            var att_name = this.$('input[name="title"]').val();
            this.att_name = att_name;
        }
    });

    website.editor.MediaDialog = website.editor.MediaDialog.extend({
        start: function() {
            var self = this;

            this.fileDialog = new website.editor.fileDialog(this, this.editor, this.media);
            this.fileDialog.appendTo(this.$("#editor-media-file"));

            $('a[data-toggle="tab"]').on('shown.bs.tab', function(event) {
                if ($(event.target).is('[href="#editor-media-file"]')) {
                    self.active = self.fileDialog;
                    self.$('li.search, li.previous, li.next').removeClass("hidden");
                }
            });

            return this._super();
        }
    });
});