class HttpStatus {
    
    static get SUCCESS() {return 200; }

    static get CREATED() {return 201; }

    static get UNAUTHORIZED() {return 401; }

    static get NOTFOUND() {return 404; }

    static get INTERNAL_ERROR() {return 500; }

    static get BAD_REQUEST() {return 400; }

    static get FORBIDDEN() {return 403; }
}

module.exports = HttpStatus;