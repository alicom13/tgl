// tgl.js - Library Input Tanggal Format dd/mm/yyyy
class DateInput {
    constructor(inputElement, options = {}) {
        if (!inputElement) {
            throw new Error('Element input harus disediakan');
        }
        
        this.input = inputElement;
        this.options = Object.assign({
            minYear: 1900,
            maxYear: 9999,
            autoFormat: true,
            showValidationMessages: true,
            validateOnInit: false,
            errorElement: null,
            successElement: null,
            onValid: null,
            onInvalid: null,
            onChange: null
        }, options);
        
        this.isValid = false;
        this.init();
    }
    
    init() {
        // Tambahkan class untuk styling
        this.input.classList.add('date-input-field');
        
        // Cari elemen error dan success jika tidak disediakan
        if (this.options.showValidationMessages) {
            if (!this.options.errorElement) {
                this.options.errorElement = this.findSiblingElement('date-input-error');
            }
            if (!this.options.successElement) {
                this.options.successElement = this.findSiblingElement('date-input-success');
            }
        }
        
        // Event listeners
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keypress', this.handleKeyPress.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));
        
        // Validasi awal jika diperlukan
        if (this.options.validateOnInit) {
            this.validate();
        }
    }
    
    findSiblingElement(className) {
        let sibling = this.input.nextElementSibling;
        while (sibling) {
            if (sibling.classList && sibling.classList.contains(className)) {
                return sibling;
            }
            sibling = sibling.nextElementSibling;
        }
        return null;
    }
    
    handleInput() {
        if (this.options.autoFormat) {
            this.formatInput();
        }
        
        const wasValid = this.isValid;
        this.validate();
        
        // Panggil callback onChange
        if (this.options.onChange) {
            this.options.onChange(this.input.value, this.isValid);
        }
        
        // Panggil callback onValid/onInvalid jika status berubah
        if (wasValid !== this.isValid) {
            if (this.isValid && this.options.onValid) {
                this.options.onValid(this.input.value);
            } else if (!this.isValid && this.options.onInvalid) {
                this.options.onInvalid(this.input.value);
            }
        }
    }
    
    handleKeyPress(e) {
        const charCode = e.which ? e.which : e.keyCode;
        // Hanya izinkan angka (0-9) dan tombol kontrol
        if ((charCode < 48 || charCode > 57) && charCode !== 8 && charCode !== 46 && charCode !== 9) {
            e.preventDefault();
        }
    }
    
    handleBlur() {
        // Validasi ulang saat kehilangan fokus
        this.validate();
    }
    
    formatInput() {
        let value = this.input.value.replace(/\D/g, '');
        
        // Format: dd/mm/yyyy
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        if (value.length > 5) {
            value = value.substring(0, 5) + '/' + value.substring(5, 9);
        }
        
        this.input.value = value;
    }
    
    validate() {
        const value = this.input.value;
        this.isValid = this.isValidDate(value);
        
        // Update UI berdasarkan validasi
        this.updateValidationUI();
        
        return this.isValid;
    }
    
    isValidDate(dateString) {
        // Regex untuk format dd/mm/yyyy
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!regex.test(dateString)) return false;
        
        const [, day, month, year] = dateString.match(regex);
        const dayInt = parseInt(day, 10);
        const monthInt = parseInt(month, 10);
        const yearInt = parseInt(year, 10);
        
        // Validasi tahun
        if (yearInt < this.options.minYear || yearInt > this.options.maxYear) return false;
        
        // Validasi bulan
        if (monthInt < 1 || monthInt > 12) return false;
        
        // Validasi hari berdasarkan bulan dan tahun
        const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
        if (dayInt < 1 || dayInt > daysInMonth) return false;
        
        return true;
    }
    
    updateValidationUI() {
        // Reset classes
        this.input.classList.remove('error', 'success');
        
        if (this.options.showValidationMessages) {
            // Sembunyikan semua pesan terlebih dahulu
            if (this.options.errorElement) {
                this.options.errorElement.style.display = 'none';
            }
            if (this.options.successElement) {
                this.options.successElement.style.display = 'none';
            }
            
            // Tampilkan pesan yang sesuai
            if (this.input.value.length > 0) {
                if (this.isValid) {
                    this.input.classList.add('success');
                    if (this.options.successElement) {
                        this.options.successElement.style.display = 'block';
                    }
                } else {
                    this.input.classList.add('error');
                    if (this.options.errorElement) {
                        this.options.errorElement.style.display = 'block';
                    }
                }
            }
        }
    }
    
    // Method publik
    toDatabaseFormat() {
        if (!this.validate()) {
            throw new Error('Format tanggal tidak valid');
        }
        
        const [day, month, year] = this.input.value.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    toDateObject() {
        if (!this.validate()) {
            throw new Error('Format tanggal tidak valid');
        }
        
        const [day, month, year] = this.input.value.split('/');
        return new Date(year, month - 1, day);
    }
    
    getValue() {
        return this.input.value;
    }
    
    setValue(dateString) {
        this.input.value = dateString;
        if (this.options.autoFormat) {
            this.formatInput();
        }
        this.validate();
    }
    
    clear() {
        this.input.value = '';
        this.isValid = false;
        this.updateValidationUI();
    }
    
    destroy() {
        // Hapus event listeners
        this.input.removeEventListener('input', this.handleInput);
        this.input.removeEventListener('keypress', this.handleKeyPress);
        this.input.removeEventListener('blur', this.handleBlur);
        
        // Hapus class styling
        this.input.classList.remove('date-input-field', 'error', 'success');
    }
    
    // Method statis untuk utilitas
    static toDatabaseFormat(dateString) {
        if (!DateInput.isValid(dateString)) {
            throw new Error('Format tanggal tidak valid');
        }
        
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    static isValid(dateString, minYear = 1900, maxYear = 2099) {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!regex.test(dateString)) return false;
        
        const [, day, month, year] = dateString.match(regex);
        const dayInt = parseInt(day, 10);
        const monthInt = parseInt(month, 10);
        const yearInt = parseInt(year, 10);
        
        if (yearInt < minYear || yearInt > maxYear) return false;
        if (monthInt < 1 || monthInt > 12) return false;
        
        const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
        if (dayInt < 1 || dayInt > daysInMonth) return false;
        
        return true;
    }
    
    static today() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// Export untuk environment module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateInput;
}
