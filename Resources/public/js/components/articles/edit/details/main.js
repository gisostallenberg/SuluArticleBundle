/*
 * This file is part of Sulu.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

define([
    'underscore',
    'jquery',
    'suluarticle/services/article-manager'
], function(_, $, ArticleManager) {

    'use strict';

    return {

        layout: function() {
            return {
                extendExisting: true,

                content: {
                    width: (!!this.options.preview) ? 'fixed' : 'max',
                    rightSpace: false,
                    leftSpace: false
                }
            };
        },

        initialize: function() {
            this.saved = true;

            this.render();

            this.bindCustomEvents();
            this.listenForChange();
        },

        bindCustomEvents: function() {
            this.sandbox.on('sulu.tab.template-change', function(item) {
                this.checkRenderTemplate(item.template);
            }, this);

            this.sandbox.on('sulu.content.contents.default-template', function(name) {
                this.template = name;
                this.sandbox.emit('sulu.header.toolbar.item.change', 'template', name);
            }.bind(this));

            this.sandbox.on('sulu.tab.save', this.save.bind(this));
        },

        listenForChange: function() {
            this.sandbox.dom.on(this.$el, 'keyup', _.debounce(this.setDirty.bind(this), 10), 'input, textarea');
            this.sandbox.dom.on(this.$el, 'change', _.debounce(this.setDirty.bind(this), 10), 'input[type="checkbox"], select');
            this.sandbox.on('sulu.content.changed', this.setDirty.bind(this));
        },

        setDirty: function() {
            this.saved = false;
            this.sandbox.emit('sulu.tab.dirty');
        },

        /**
         * @param {Object} action
         */
        save: function(action) {
            if (!this.sandbox.form.validate(this.formId)) {
                this.sandbox.emit('sulu.tab.dirty', true);

                return;
            }

            var data = this.sandbox.form.getData(this.formId);
            data.template = this.template;

            _.each(data, function(value, key) {
                this.data[key] = value;
            }.bind(this));

            ArticleManager.save(this.data, this.options.locale, action).then(function(response) {
                this.data = response;
                this.sandbox.emit('sulu.tab.saved', response.id, response);
            }.bind(this)).fail(function(xhr) {
                this.sandbox.emit('sulu.article.error', xhr.status, data);
            }.bind(this));
        },

        render: function() {
            this.checkRenderTemplate(this.data.template || null);
        },

        /**
         * @param {String} template
         */
        checkRenderTemplate: function(template) {
            if (!!template && this.template === template) {
                return this.sandbox.emit('sulu.header.toolbar.item.enable', 'template', false);
            }

            this.sandbox.emit('sulu.header.toolbar.item.loading', 'template');

            if (this.template !== '' && !this.saved) {
                this.showRenderTemplateDialog(template);
            } else {
                this.loadFormTemplate(template);
            }
        },

        /**
         * @param {String} template
         */
        showRenderTemplateDialog: function(template) {
            // show warning dialog
            this.sandbox.emit('sulu.overlay.show-warning',
                'sulu.overlay.be-careful',
                'content.template.dialog.content',
                function() {
                    // cancel callback
                    this.sandbox.emit('sulu.header.toolbar.item.enable', 'template', false);

                    if (!!this.template) {
                        this.sandbox.emit('sulu.header.toolbar.item.change', 'template', this.template, false);
                    }
                }.bind(this),
                function() {
                    // ok callback
                    this.loadFormTemplate(template);
                }.bind(this)
            );
        },

        /**
         * @param {String} template
         */
        loadFormTemplate: function(template) {
            if (!template) {
                template = this.options.config.types[(this.options.type || this.data.type)].default;
            }

            this.template = template;
            this.formId = '#content-form-container';
            this.$container = this.sandbox.dom.createElement('<div id="content-form-container"/>');
            this.html(this.$container);

            if (!!this.sandbox.form.getObject(this.formId)) {
                var data = this.data;
                this.data = this.sandbox.form.getData(this.formId);
                if (!!data.id) {
                    this.data.id = data.id;
                }

                this.data = this.sandbox.util.extend({}, data, this.data);
            }

            require([this.getTemplateUrl(template)], function(template) {
                this.renderFormTemplate(template);
            }.bind(this));
        },

        /**
         * @param {String} template
         *
         * @returns {String}
         */
        getTemplateUrl: function(template) {
            var url = 'text!/admin/content/template/form';
            if (!!template) {
                url += '/' + template + '.html';
            } else {
                url += '.html';
            }
            url += '?type=article&language=' + this.options.locale;

            if (!!this.data.id) {
                url += '&uuid=' + this.data.id;
            }

            return url;
        },

        /**
         * @param {String} template
         */
        renderFormTemplate: function(template) {
            this.sandbox.dom.html(this.formId, this.sandbox.util.template(template, {
                translate: this.sandbox.translate,
                content: this.data,
                options: this.options
            }));

            if (!this.data.id) {
                // route-path will be generator on post-request
                this.$find('#routePath').parent().remove();
            }

            this.createForm(this.data).then(function() {
                this.changeTemplateDropdownHandler();
            }.bind(this));
        },

        changeTemplateDropdownHandler: function() {
            if (!!this.template) {
                this.sandbox.emit('sulu.header.toolbar.item.change', 'template', this.template);
            }
            this.sandbox.emit('sulu.header.toolbar.item.enable', 'template', false);
        },

        /**
         * @param {Object} data
         *
         * @returns {Object}
         */
        createForm: function(data) {
            var formObject = this.sandbox.form.create(this.formId),
                deferred = this.sandbox.data.deferred();

            formObject.initialized.then(function() {
                this.sandbox.form.setData(this.formId, data).then(function() {
                    this.sandbox.start(this.$el, {reset: true}).then(function() {
                        this.initSortableBlock();
                        this.bindFormEvents();
                        deferred.resolve();

                        if (!!this.options.preview) {
                            this.options.preview.bindDomEvents(this.$el);
                            var data = this.data;
                            data.template = this.template;
                            this.options.preview.updateContext({template: this.template}, data);
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));

            return deferred.promise();
        },

        initSortableBlock: function() {
            var $sortable = this.sandbox.dom.find('.sortable', this.$el),
                sortable;

            if (!!$sortable && $sortable.length > 0) {
                this.sandbox.dom.sortable($sortable, 'destroy');
                sortable = this.sandbox.dom.sortable($sortable, {
                    handle: '.move',
                    forcePlaceholderSize: true
                });

                // (un)bind event listener
                this.sandbox.dom.unbind(sortable, 'sortupdate');

                sortable.bind('sortupdate', function(event) {
                    // update preview
                    this.updatePreviewProperty(event.currentTarget, null);

                    this.sandbox.emit('sulu.content.changed');
                }.bind(this));
            }
        },

        bindFormEvents: function() {
            this.sandbox.dom.on(this.formId, 'form-remove', function(event, propertyName) {
                this.initSortableBlock();
                this.setDirty();

                // update preview
                this.updatePreviewProperty(event.currentTarget, propertyName);
            }.bind(this));

            this.sandbox.dom.on(this.formId, 'form-add', function(event, propertyName, data, index) {
                var $elements = this.sandbox.dom.children(this.$find('[data-mapper-property="' + propertyName + '"]')),
                    $element = (index !== undefined && $elements.length > index) ? $elements[index] : this.sandbox.dom.last($elements);

                // start new subcomponents
                this.sandbox.start($element);

                // enable save button
                this.setDirty();

                // reinit sorting
                this.initSortableBlock();

                // update preview
                this.updatePreviewProperty(event.currentTarget, propertyName);
            }.bind(this));

            this.sandbox.dom.on(this.formId, 'init-sortable', function(e) {
                // reinit sorting
                this.initSortableBlock();
            }.bind(this));
        },

        loadComponentData: function() {
            var promise = $.Deferred();

            promise.resolve(this.options.data());

            return promise;
        },

        /**
         * @param {Object} target
         * @param {String} propertyName
         */
        updatePreviewProperty: function(target, propertyName) {
            if (!!this.options.preview) {
                var data = this.sandbox.form.getData(this.formId);

                if (!propertyName && !!target) {
                    propertyName = this.sandbox.dom.data(target, 'mapperProperty');
                }

                this.options.preview.updateProperty(propertyName, data[propertyName]);
            }
        }
    };
});
