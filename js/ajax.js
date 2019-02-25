
/* 
*************************************************************************************
Exécute un appel AJAX GET
************************************************************************************* 
*/

// Prend en paramètres l'URL cible et la fonction callback appelée en cas de succès
function ajaxGet(url, callback) {
    // Création d'une requête HTTP
    var req = new XMLHttpRequest();
    // La requête est asynchrone lorsque le 3ème paramètre vaut true ou est absent
    req.open("GET", url);
    // Envoi de la requête
    req.send(null);
    // Affiche la réponse reçue pour la requête
    req.addEventListener("load", function () {
        if (req.status >= 200 && req.status < 400) { // Le serveur a réussi à traiter la requête
            // Appelle la fonction callback en lui passant la réponse de la requête
            callback(req.responseText); 
        } else {
            console.error(req.status + " " + req.statusText + " " + url); // Affichage des informations sur l'échec du traitement de la requête
        }
    });
    req.addEventListener("error", function () {
        // La requête n'a pas réussi à atteindre le serveur
        console.error("Erreur réseau avec l'URL " + url);
    });
    
}
