import RFB from './core/rfb.js';

//#region Global Data
const url = "http://localhost:5600/login/"
const ws = "ws://localhost:5600/"
const postOptions = {
    method: 'POST',
    mode: "cors",
    headers: {
        'Content-Type': 'application/json'
    }
}
//#endregion

//#region UI binding
const modal = document.getElementById("id01");
const button = document.getElementById("logButton")
const usernameInput = document.getElementById("usernameInput")
const passwordInput = document.getElementById("passwordInput")
const passwordVncInput = document.getElementById("passwordVncInput")
//#endregion

//#region Initialisation 

document.getElementById('id01').style.display = 'block' // par défaut on affiche la fenetre de connexion

button.onclick = (event) => {                           // Gestion du bouton de validation

    postOptions.body = JSON.stringify({
        "name": usernameInput.value,
        "password": passwordInput.value
    })
    ProcessConnection(fetch(url, postOptions))
    
}

//#endregion

//#region Connection Process

const ProcessConnection = (request) => {
    request.then(res => {                                           // Reception de résultat
        switch (res.status) {
            case 200:                                               // Reception OK
                return res.json()
            case 401:                                               // Mauvais login
                status("Haha Mauvais mot de passe")
                break
            default:                                                // Autres cas
                status("Etrange !! Y a un truc qui cloche")
        }
    })
        .then(data => {                                             // Reception des datas
            console.log(data.token)
            modal.style.display = "none";
            CreateConnection(data.token)
        })
        .catch(err => {                                             // Erreur de conection
            console.log(err.message)
            status("Haha Mauvais mot de passe")
        })
}

const CreateConnection = ( token ) => {
    const conn = new Connection(ws,token, passwordVncInput.value)
    document.getElementById('sendCtrlAltDelButton').onclick = conn.sendCtrlAltDel
}

//#endregion

//#region Utilities
function status(text) {
    document.getElementById("status").textContent = text
}
//#endregion

/**
 * @description Class de gestion de la connexion vers le serveur. Elle contient le binding vers les evenements renvoyé par RFB
 * @author m.louvel
 * @date 08/09/2022
 * @class Connection
 */
class Connection {
    constructor(url, token , vncpassword) {
        
        status("Connecting")
        const connecturl = `${url}${token}`
        this.rfb = new RFB(document.getElementById('screen'), connecturl)
        // Add listeners to important events from the RFB module
        this.rfb.addEventListener("connect", this.connectedToServer);
        this.rfb.addEventListener("disconnect", this.disconnectedFromServer);
        this.rfb.addEventListener("credentialsrequired", this.credentialsAreRequired);
        this.rfb.addEventListener("desktopname", this.updateDesktopName);
        // Set parameters that can be changed on an active connection
        this.rfb.viewOnly = false
        this.rfb.scaleViewport = false
        this.desktopName = ""
        this.rfb.vncpassword = vncpassword
    }

    // When this function is called we have
    // successfully connected to a server
    connectedToServer(e) {
        status("Connected to " + this.desktopName);
    }

    // This function is called when we are disconnected
    disconnectedFromServer(e) {
        if (e.detail.clean) {
            status("Disconnected");
        } else {
            status("Something went wrong, connection is closed");
        }
    }

    // When this function is called, the server requires
    // credentials to authenticate
    credentialsAreRequired(e) {
        this.sendCredentials({ password: this.vncpassword })
    }

    // When this function is called we have received
    // a desktop name from the server
    updateDesktopName(e) {
        this.desktopName = e.detail.name
    }

    // Since most operating systems will catch Ctrl+Alt+Del
    // before they get a chance to be intercepted by the browser,
    // we provide a way to emulate this key sequence.
    sendCtrlAltDel() {
        this.rfb.sendCtrlAltDel()
        return false
    }

}

