var bytesToString = function(bytes) {
    return String.fromCharCode.apply(String, bytes);
}

var index_i = 0, index_j = 0;

function RC4(key) {
    this.key = key;
}

RC4.prototype.init = function() {
    index_i = 0, index_j = 0;
    this.arr = Array(256);
    for (var i = 0; i < 256; i++) {
        this.arr[i] = i;
    }

    var j = 0;
    for (var i = 0; i < 256; i++) {
        j = (j + this.arr[i] + this.key.charCodeAt(i % this.key.length)) % 256;

        this.arr[j] = [this.arr[i], this.arr[i] = this.arr[j]][0]
        
    }
}

RC4.prototype.getByte = function() {
    index_i = (index_i + 1) % 256;
    index_j = (index_j + this.arr[index_i]) % 256;

    this.arr[index_j] = [this.arr[index_i], this.arr[index_i] = this.arr[index_j]][0];    
    return this.arr[(this.arr[index_i] + this.arr[index_j]) % 256];
}

var encrypt = function(key, msg) {
    var IV = new Uint8Array(5);
    window.crypto.getRandomValues(IV);
    
    msg = bytesToString(msg);
    var IVStr = bytesToString(IV);
    var rc4 = new RC4(IVStr + key);
    rc4.init();

    var encrypted = new Uint8Array(msg.length);

    for (var i = 0; i < msg.length; i++) {
        encrypted[i] = msg.charCodeAt(i) ^ rc4.getByte();
    }
    return IVStr + bytesToString(encrypted);
}

var decrypt = function(key, encrypted) {
    var rc4 = new RC4(encrypted.substring(0, 5) + key);
    rc4.init();
    var len = encrypted.length - 5;
    var msg = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
        msg[i] = encrypted.charCodeAt(i + 5) ^ rc4.getByte();
    }

    return msg;
}
