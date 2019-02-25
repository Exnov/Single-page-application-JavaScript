# p3
"Single page Application" développée en JS, simulant la réservation de vélos à Toulouse. 

## Éléments de la page :

### Un diaporama :
Le diaporama explique le fonctionnement de l'application, et n'utilise aucun plugin.

### Une carte des vélos :
En s'appuyant sur une API de cartographie, et de l'API JC Decaux, on génère une carte qui affiche en temps réel la liste des stations de location de vélos ainsi que leur disponibilité.

### La réservation d'un vélo :
- Avec l'API HTML5 Canvas, on crée un champ libre où l'utilisateur signe pour valider sa réservation. Là encore, aucun plugin n'est utilisé.
- Les données de réservation sont stockées dans le navigateur à l’aide de l’API Web Storage.