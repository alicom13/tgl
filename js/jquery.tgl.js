// jquery.tgl.js - jQuery Date Input Plugin
(function($) {
    'use strict';
    
    // Default options
    const defaults = {
        minYear: 1900,
        maxYear: 9999,
        autoFormat: true,
        showValidationMessages: true,
        validateOnInit: false,
        errorElement: null,
        successElement: null,
        onValid: null,
        onInvalid: null,
        onChange: null,
        placeholder: 'dd/mm/yyyy'
    };
    
    // Plugin constructor
    function Tgl(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, defaults, options);
        this.isValid = false;
        this._init();
    }
    
    Tgl.prototype = {
        _init: function() {
            // Add CSS classes
            this.$element.addClass('tgl-field');
            
            // Set placeholder if provided
            if (this.options.placeholder) {
                this.$element.attr('placeholder', this.options.placeholder);
            }
            
            // Find error and success elements if not provided
            if (this.options.showValidationMessages) {
                if (!this.options.errorElement) {
                    this.options.errorElement = this._findSiblingElement('.tgl-error-message');
                }
                if (!this.options.successElement) {
                    this.options.successElement = this._findSiblingElement('.tgl-success-message');
                }
            }
            
            // Bind events
            this._bindEvents();
            
            // Initial validation if needed
            if (this.options.validateOnInit) {
                this.validate();
            }
        },
        
        _findSiblingElement: function(selector) {
            return this.$element.nextAll(selector).first();
        },
        
        _bindEvents: function() {
            this.$element
                .on('input.tgl', this._handleInput.bind(this))
                .on('keypress.tgl', this._handleKeyPress.bind(this))
                .on('blur.tgl', this._handleBlur.bind(this));
        },
        
        _handleInput: function() {
            if (this.options.autoFormat) {
                this._formatInput();
            }
            
            const wasValid = this.isValid;
            this.validate();
            
            // Call onChange callback
            if (typeof this.options.onChange === 'function') {
                this.options.onChange(this.getValue(), this.isValid);
            }
            
            // Call onValid/onInvalid if status changed
            if (wasValid !== this.isValid) {
                if (this.isValid && typeof this.options.onValid === 'function') {
                    this.options.onValid(this.getValue());
                } else if (!this.isValid && typeof this.options.onInvalid === 'function') {
                    this.options.onInvalid(this.getValue());
                }
            }
        },
        
        _handleKeyPress: function(e) {
            const charCode = e.which ? e.which : e.keyCode;
            // Only allow numbers and control keys
            if ((charCode < 48 || charCode > 57) && charCode !== 8 && charCode !== 46 && charCode !== 9) {
                e.preventDefault();
            }
        },
        
        _handleBlur: function() {
            // Re-validate on blur
            this.validate();
        },
        
        _formatInput: function() {
            let value = this.$element.val().replace(/\D/g, '');
            
            // Format: dd/mm/yyyy
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            if (value.length > 5) {
                value = value.substring(0, 5) + '/' + value.substring(5, 9);
            }
            
            this.$element.val(value);
        },
        
        _updateValidationUI: function() {
            // Reset classes
            this.$element.removeClass('tgl-error tgl-success');
            
            if (this.options.showValidationMessages) {
                // Hide all messages first
                if (this.options.errorElement) {
                    this.options.errorElement.hide();
                }
                if (this.options.successElement) {
                    this.options.successElement.hide();
                }
                
                // Show appropriate message
                if (this.$element.val().length > 0) {
                    if (this.isValid) {
                        this.$element.addClass('tgl-success');
                        if (this.options.successElement) {
                            this.options.successElement.show();
                        }
                    } else {
                        this.$element.addClass('tgl-error');
                        if (this.options.errorElement) {
                            this.options.errorElement.show();
                        }
                    }
                }
            }
        },
        
        // Public methods
        validate: function() {
            const value = this.$element.val();
            this.isValid = this._isValidDate(value);
            this._updateValidationUI();
            return this.isValid;
        },
        
        _isValidDate: function(dateString) {
            // Regex for dd/mm/yyyy format
            const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            if (!regex.test(dateString)) return false;
            
            const match = dateString.match(regex);
            const dayInt = parseInt(match[1], 10);
            const monthInt = parseInt(match[2], 10);
            const yearInt = parseInt(match[3], 10);
            
            // Validate year
            if (yearInt < this.options.minYear || yearInt > this.options.maxYear) return false;
            
            // Validate month
            if (monthInt < 1 || monthInt > 12) return false;
            
            // Validate day based on month and year
            const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
            if (dayInt < 1 || dayInt > daysInMonth) return false;
            
            return true;
        },
        
        toDatabaseFormat: function() {
            if (!this.validate()) {
                throw new Error('Format tanggal tidak valid');
            }
            
            const parts = this.$element.val().split('/');
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            
            return `${year}-${month}-${day}`;
        },
        
        toDateObject: function() {
            if (!this.validate()) {
                throw new Error('Format tanggal tidak valid');
            }
            
            const parts = this.$element.val().split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        },
        
        getValue: function() {
            return this.$element.val();
        },
        
        setValue: function(dateString) {
            this.$element.val(dateString);
            if (this.options.autoFormat) {
                this._formatInput();
            }
            this.validate();
        },
        
        clear: function() {
            this.$element.val('');
            this.isValid = false;
            this._updateValidationUI();
        },
        
        destroy: function() {
            // Remove event listeners
            this.$element.off('.tgl');
            
            // Remove CSS classes
            this.$element.removeClass('tgl-field tgl-error tgl-success');
            
            // Remove placeholder
            this.$element.removeAttr('placeholder');
            
            // Remove data
            this.$element.removeData('tgl');
        }
    };
    
    // jQuery plugin definition
    $.fn.tgl = function(options) {
        const args = Array.prototype.slice.call(arguments, 1);
        
        return this.each(function() {
            const $this = $(this);
            let data = $this.data('tgl');
            
            // Initialize plugin if not already initialized
            if (!data) {
                if (typeof options === 'object' || !options) {
                    data = new Tgl(this, options);
                    $this.data('tgl', data);
                }
            }
            
            // Call method if provided
            if (typeof options === 'string') {
                if (data && typeof data[options] === 'function') {
                    data[options].apply(data, args);
                } else {
                    $.error('Method ' + options + ' does not exist on jQuery.tgl');
                }
            }
        });
    };
    
    // Static methods
    $.tgl = {
        toDatabaseFormat: function(dateString) {
            const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            if (!regex.test(dateString)) {
                throw new Error('Format tanggal tidak valid');
            }
            
            const parts = dateString.split('/');
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            
            return `${year}-${month}-${day}`;
        },
        
        isValid: function(dateString, minYear = 1900, maxYear = 2099) {
            const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            if (!regex.test(dateString)) return false;
            
            const parts = dateString.split('/');
            const dayInt = parseInt(parts[0], 10);
            const monthInt = parseInt(parts[1], 10);
            const yearInt = parseInt(parts[2], 10);
            
            if (yearInt < minYear || yearInt > maxYear) return false;
            if (monthInt < 1 || monthInt > 12) return false;
            
            const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
            if (dayInt < 1 || dayInt > daysInMonth) return false;
            
            return true;
        },
        
        today: function() {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            return `${day}/${month}/${year}`;
        },
        
        version: '1.0.0'
    };
    
})(jQuery);
