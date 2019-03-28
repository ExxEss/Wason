var llave = "Hola",
    nombreUsuario,
    msj1,
    msj2;

// El nombre de la persona que chatea con nosotros
var amigo;

// color del elemento div que este el amigo
var color = "#AAA";
var websocket = conectar(),
    boton = document.getElementById('boton'),
    mensaje = document.getElementById('mensaje'),
    salida = document.getElementById('salida'),
    usuarios = document.getElementById('usuarios');

websocket.onclose = function() {
    window.setTimeout(function() {
        conectar();
    }, 1000);
};

function conectar() {
    return new WebSocket("ws://18.220.235.202:7500/");
}

var obtenerNombreUsuario = function() {
    nombreUsuario = prompt("Registrarte con tu nombre");
    msj1 = JSON.stringify({"tipo": "registro",
        "nombre": nombreUsuario});
    msj2 = JSON.stringify({"tipo": "usuarios"});

    var agent=navigator.userAgent.toLowerCase();

    // websocket funciona distinto para chrome y firefox
    if (agent.indexOf('chrome') > 0) {
        websocket.onopen = function () {
            // mandar mensaje al servidor para registrarse
            websocket.send(msj1);

            // mandar mensaje al servidor por la lista de usuarios
            websocket.send(msj2);
        }
    } else {
        websocket.send(msj1);
        websocket.send(msj2);
    }
}();

// cada 5 segundo actualizamos una vez la lista de usuarios
window.setInterval(function() { websocket.send(msj2);}, 5000);

var parseJson = function(str){
    var obj = JSON.parse(str);

    if(obj.peticion === "usuarios") {
        actualizarListaUsuario(
            obj.detalles.slice(0, -1).split(',').sort());
        return false;
    } else if(obj.tipo === "respuesta" &&
        obj.peticion !== "msj_enviado" &&
        obj.peticion !== "registro") {

        return " " + obj.detalles;
    } else if(obj.tipo == "msj_nuevo") {
        return utf8ByteArrayToString(
            decrypt(llave, window.atob(obj.msj)));
    } else if(obj.tipo == "msj_chat") {
        return  obj.msj;
    }
}

// aqui el parametro posicion signifia donde ponemos la conversacion
var appendHtml = function(str, posicion) {
    var nuevaLinea = document.createElement('div');
    var nuevaConversacion = document.createElement('div');
    var formatoTiempo = document.createElement('div');
    var strHtml = parseJson(str);

    var tiempo = (new Date()).toLocaleTimeString(
        navigator.language,
        {hour: '2-digit', minute:'2-digit'})

    if (!strHtml) {
        return;
    }

    nuevaConversacion.innerHTML = parseJson(str);

    if (nuevaConversacion.innerHTML) {
        nuevaLinea.setAttribute("class", "conversacion_contenedor");

        if (posicion === "izq") {
            tiempo = "<p id=\"tiempo_izq\">" + tiempo + "<\/p>";
            nuevaLinea.setAttribute("align", "left");
            nuevaConversacion.setAttribute("class", "conversacion_izq");
        } else {
            tiempo = "<p id=\"tiempo_der\">" + tiempo + "<\/p>";
            nuevaLinea.setAttribute("align", "right");
            nuevaConversacion.setAttribute("class", "conversacion_der");
        }

        formatoTiempo.innerHTML = tiempo;
        nuevaLinea.appendChild(nuevaConversacion);
        salida.appendChild(nuevaLinea);
        salida.appendChild(formatoTiempo);
        salida.scrollTop = salida.scrollHeight;
    }
}

var actualizarListaUsuario = function(listaUsuario) {
    usuarios.innerHTML = "";

    var dibujaUsuario = function(nombreStr) {
        var usuario = document.createElement('div');
        var icono = document.createElement('div');
        var nombre = document.createElement('div');

        nombre.setAttribute("class", "nombre");
        nombre.textContent = nombreStr;

        if (nombre.textContent === amigo) {
            usuario.style.background = color;
        }

        if (nombre.textContent === nombreUsuario) {
            icono.setAttribute("class", "icono1");
        } else {
            icono.setAttribute("class", "icono2");
        }

        usuario.appendChild(icono);
        usuario.appendChild(nombre);
        usuario.setAttribute("onclick", "clickUsuario(this)");
        usuario.setAttribute("class", "usuario");
        usuarios.appendChild(usuario);
    }

    dibujaUsuario(nombreUsuario);

    for (var i = 0; i < listaUsuario.length; i++) {
        var nombreStr = listaUsuario[i].slice(2, -1);

        if(nombreStr !== nombreUsuario) {
            dibujaUsuario(nombreStr);
        }
    }
}

var clickUsuario = function(object) {
    amigo = object.innerText;
    hijos = usuarios.getElementsByTagName("div");

    for (var i = 0; i < hijos.length; i++) {
        if (hijos[i].innerText === amigo) {
            hijos[i].style.background = color;
        } else {
            hijos[i].style.background = "";
        }
    }
}

boton.onclick = function() { mandarMsj(); }

websocket.onmessage = function(event) {
    appendHtml(event.data, "izq");
}

mensaje.addEventListener("keydown", function (event) {
    if (event.key === 'Enter') { mandarMsj(); }
}, true);

function mandarMsj() {
    if(typeof amigo === "string") {
        if(mensaje.value) {
            var value = "{\"tipo\": \"msj_chat\", \"destino\": \""
                + amigo + "\", \"msj\":" + "\"" +
                mensaje.value + "\"" + "}";

            websocket.send(cifrarMsj(value));
            appendHtml(value, "der");
            mensaje.value = "";
        }
    } else {
        confirm("Tienes que eligir un amigo 🤠");
    }
}

var cifrarMsj = function(str) {
    json = JSON.parse(str);

    if(json.msj) {
        json.msj = window.btoa(encrypt(
            llave, stringToUtf8ByteArray(json.msj)));
    }
    return JSON.stringify(json);
}

