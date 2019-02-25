$(function(){
//DEBUT CODE

	/* 
	*************************************************************************************
	CARTE DES VELOS ET RESERVATION D'UN VELO
	-1- Déclaration de variables et sélection d'éls dans le DOM
	-2- Création d'objets
	-3- Définition d'objets
	-4- vérification des données stockées dans le navigateur avec l'API WebStorage
	-5- Requête Ajax pour afficher les stations vélos sur la carte de Toulouse (API JCDecaux et API Leaflet)
	-6- Réservation d'un vélo via soumission formulaire et signature sur canvas (event listening de <form> et <canvas>)
	-7- Fonctions
	************************************************************************************* 
	*/


	/*
	**********************************************************************
	-1- Déclaration de variables et sélection d'élts dans le DOM
	**********************************************************************
	*/

	//formulaire de réservation
	var form=document.querySelector("form");
	var legende=document.querySelector("legend");
	var ligneAdresse=document.querySelector("#adresse");
	var ligneInfos=document.querySelector("#infosVelos");
	//affichage infos réservations
	var confirmation=document.querySelector("#confirmation > p");
	var decompte=document.querySelector("#decompte");
	//stations vélos
	var urlJson="https://api.jcdecaux.com/vls/v1/stations?contract=toulouse&apiKey=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; //url pour requête ajax avec l'API jcdecaux
	var stationsVille=""; //futur tableau js qui contiendra la liste json des stations de vélo de la ville de Toulouse
	var infosStations=[]; //tableau d'objets Station
	var stationUser=""; //objet Station qui contiendra les infos de la station choisie par l'user
	var stationTport=""; //contient les informations de la station réservée après rechargement de la page
	//réservation
	var reservation=""; //objet Reservation qui contiendra les infos sur l'user et sa réservation
	var duree=0; //contiendra la durée de validation de la réservation
	var titreTemps="Temps restant : "; //string à afficher pour le compte à rebours de la réservation
	//carte
	var toulouseCoords=[43.604652, 1.4442090000000007];
	var mymap=""; //représente la carte
	var markerTemoin=""; //contient le marker de la réservation encore en cours et que l'user voudrait écraser
	var markerPresent=""; //contient le marker de le réservation que l'user vient de réserver
	//canvas
	var modale=$("#modale");
	var canvas = document.querySelector('#canvas');
	//validation marqueur velo :
	var veloIcon = L.icon({
	    iconUrl: 'images/velo.png',       
	    iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location 
	    shadowUrl: 'images/marker-shadow.png'    
	});
	var defaultIcon = L.icon({
	    iconUrl: 'images/marker-icon.png',
	    iconAnchor: [12, 41],
	    shadowUrl: 'images/marker-shadow.png'
	});


	/*
	**********************************************************************
	-2- Définition d'objets
	**********************************************************************
	*/


	/*
	**********************************************************
	définition de l'objet Reservation Local (prototype): 2 elts :
	**********************************************************
	*/
	var ReservationLocal={

		//initialise la réservation
		initResLocal: function(nom,prenom){
			this.nom=nom;
			this.prenom=prenom;
		},
		//enregistrer les données de réservation pour l'API webstorage
		saveReservation:function(){
			var reservation=this;
		    var reservation_json = JSON.stringify(reservation); //conversion de notre objet javascript en liste JSON
			localStorage.setItem("reservation",reservation_json);
		},
		getReservation:function(){
			var reservation_json = localStorage.getItem("reservation");
			return JSON.parse(reservation_json);
		}
	};

	/*
	**********************************************************
	définition de l'objet Reservation Session (à partir du prototype ReservationLocal): 4 elts : 
	**********************************************************
	*/
	var ReservationSession = Object.create(ReservationLocal);

	ReservationSession.initResSession = function (station,nom,prenom,expiration) {

	    this.initResLocal(nom,prenom);
	    this.station=station;
	    this.expiration=expiration;
	};	
	//surcharge de la méthode saveReservation() :
	ReservationSession.saveReservation = function (){
		var reservation=this;
		var reservation_json=JSON.stringify(reservation); //conversion de notre objet javascript en liste JSON
		sessionStorage.setItem("reservation",reservation_json);		
	};
	//surcharge de la méthode getReservation() :
	ReservationSession.getReservation = function (){
    	var reservation_json = sessionStorage.getItem("reservation");
		return JSON.parse(reservation_json); //conversion de la liste JSON en tableau javascript	
	};	


	/*
	**********************************************************
	définition de l'objet Station :
	**********************************************************
	*/
	var Station = {
	    // Initialise la station
	    init: function (ville, nom, adresse,position,statut,placesTotal,placesDispo,velosDispo) {
	    	this.ville=ville;
	    	this.nom=nom;
	    	this.adresse=adresse;
	    	this.position=position;
	    	this.statut=statut;
	    	this.placesTotal=placesTotal;
	    	this.placesDispo=placesDispo;
	    	this.velosDispo=velosDispo;
	    },
	    getName:function(){
	    	return "Détails de la station " + this.nom.toLowerCase();
	    },
	    getAddress:function(){
	    	return "Adresse : " + this.adresse.toLowerCase();
	    },
	    getAvailableBikes:function(){
	    	return this.velosDispo + " vélos disponibles";
	    },
	    getPlaces:function(){
	    	return this.placesTotal + " places";
	    },
	    getStatus:function(){
	    	var etat="";
	    	if(this.statut==="OPEN"){
	    		etat="ouvert";
	    	}
	    	else{
	    		etat="fermé";
	    	}
	    	return "état : " + etat;
	    }
	};

	/*
	**********************************************************
	définition de l'objet Surface pour la signature au moment de la réservation :
	**********************************************************
	*/
	var Surface={

		init:function(canvas){

			this.canvas=canvas;

		},

		lancerSignature:function(){
			var canvas=this.canvas;
			var ctx="";
			//mouse
			canvas.addEventListener("mousedown", function(e){
				ctx = canvas.getContext('2d'); 
				ctx.beginPath(); 
			    canvas.addEventListener("mousemove",signature_mouse);
			});

			canvas.addEventListener("mouseup", function(e){
			    canvas.removeEventListener("mousemove",signature_mouse);
			});

			//touch
			canvas.addEventListener('touchstart',function(e){ 
			    ctx = canvas.getContext('2d');
			    ctx.beginPath();
			    canvas.addEventListener("touchmove",signature_touch);
			});

			/*
			**********************************************************************
			fonction tracer dans canvas pour signature
			**********************************************************************
			*/
			//mouse
			 function signature_mouse(e){			
				ctx.lineTo(e.offsetX, e.offsetY); 
			    ctx.stroke();
			}

			//touch
			 function signature_touch(e){
			    e.preventDefault(); //empêche le scrolling pendant la signature (en arrière plan du canvas)

			    var rect = e.target.getBoundingClientRect(); //récupération des distances relatives du canvas par rapport à l'écran

			    var x=e.touches[0].clientX - rect.left; // soustraction du x pour compenser le décalage x dû à l'application de la distance du x vis à vis du bord gauche de l'écran au bord gauche de la toile
			    var y=e.touches[0].clientY- rect.top; // soustraction du x pour compenser le décalage y dû à l'application de la distance du y vis à vis du bord top de l'écran au bord top de la toile

			    ctx.lineTo(x, y); 
			    ctx.stroke(); //On trace maintenant la "ligne" (point)
			}
		}

	};

	/*
	**********************************************************
	définition de l'objet Chrono pour gérer le compte à rebours de la réservation :
	**********************************************************
	*/
	var Chrono={

		init:function(secondes){
			this.secondes=secondes;
			this.fn="";
		},

		start:function(action1,action2){
			var secondes=this.secondes;
			this.fn=setInterval(rebours, 1000);
			function rebours(){

				if(secondes>0){
					action1(secondes);
				}
				else{
					clearInterval(this.fn);
					action2();
				}

				secondes-=1;
			}

		},
		stop:function(){ 
			clearInterval(this.fn);;
		}

	};

	/*
	**********************************************************
	définition de l'objet Expiration : pour récupérer le temps d'expiration de la réservation en secondes et millisecondes
	**********************************************************
	*/
	var Expiration={

		init:function(){
			this.date=new Date();
		},

		get_expiration_secondes:function(exp_millisecondes){
			var millisecondes = this.date.getTime();
			var secondes=0;
			//calcul du temps restant :
			var delai=exp_millisecondes-millisecondes;
			if(delai>0){ //si >0 on reprend le compte à rebours
				secondes=Math.round(delai/1000); //durée en secondes, on arrondit
			}
			return secondes;
		},
		//calcul en millisecondes epoch de l'expiration de la réservation pour notre objet Reservation
		get_expiration_millisecondes:function(exp_secondes){ //durée en secondes de la réservation en cours
			var millisecondes = this.date.getTime();			
			var exp_millisecondes=millisecondes + (1000*exp_secondes); 
			return exp_millisecondes;

		}

	};


	/*
	**********************************************************************
	-3- Création d'objets
	**********************************************************************
	*/

	//création de l'objet Surface :
	var surface=Object.create(Surface);
	surface.init(canvas);
	surface.lancerSignature();

	//création de notre objet Chrono :
	var chrono=Object.create(Chrono);

	//création de l'objet Expiration
	var expTime=Object.create(Expiration);

	
	/*
	**********************************************************************
	-4- Vérification des données stockées dans le navigateur avec l'API WebStorage
	**********************************************************************
	*/
	checkSessionStorage();

	/*
	**********************************************************************
	-5- Requête Ajax de type GET :
	-requête ajax pour recupération des données vélos avec l'API jcdecaux
	récupération des données
	-en cas de succès création d'une carte avec l'API leaflet
	**********************************************************************
	*/

	ajaxGet(urlJson, function(reponse){

	  		stationsVille=JSON.parse(reponse); //conversion de la liste JSON en tableau js

	  		stationsVille.forEach(function(infos){ //parcours des différentes stations de la ville de Toulouse
	  			/*
				Création de l'objet station :
				-pour générer les marqueurs sur la carte
				-pour créer un tableau d'objets Station permettant de fournir des infos sur les stations à partir des marqueurs
	  			*/

	  			//récupération des infos pertinentes sur les stations
	  			var ville="toulouse";
	  			var nom=infos.name;
	  			var adresse=infos.address;
	  			var position=[infos.position["lat"],infos.position["lng"]];
	  			var statut=infos.status;
	  			var placesTotal=infos.bike_stands;
	  			var placesDispo=infos.available_bike_stands;
	  			var velosDispo=infos.available_bikes;

	  			var station = Object.create(Station);
	  			station.init(ville, nom, adresse,position,statut,placesTotal,placesDispo,velosDispo);

	  			infosStations.push(station);
		 
	  		});

			//CARTOGRAPHIE : API leaflet : création de la carte de la ville de Toulouse
			mymap = L.map('mapid').setView(toulouseCoords, 13); 


			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', {
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
					'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
					'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				id: 'mapbox.streets'
			}).addTo(mymap);

			//markercluster : création du markercluster
			var markers = new L.MarkerClusterGroup();

			//affichage des stations sur la carte avec marqueur et gestion de la récupération des infos de la stations choisie par l'user:
			infosStations.forEach(function(stationMarqueur){

				var marker = L.marker(stationMarqueur.position); //création du marqueur avec sa position
				
				//remettre le marqueur vélo au rechargement de la page si réservation en cours
				if(sessionStorage.getItem('reservation')){
					if(stationTport.position[0]===stationMarqueur.position[0] && stationTport.position[1]===stationMarqueur.position[1]){
						markerTemoin=marker; 
						marker.setIcon(veloIcon);
					}					
				}							
				//----------------------------------------------------------------
				function onMarkerClick(e) { //fonction d'event listener  pour le clique sur marqueur

					//affichage d'un pop up					
					var popup = L.popup({offset: new L.Point(0, -30)}); //création d'un popup et décalage vertical vers le haut du popup
				    popup
				        .setLatLng(e.latlng)
				        .setContent("Station " + stationMarqueur.nom.toLowerCase()) // affichage du nom de la station
				        .openOn(mymap);
				     
				     //préparation de la recherche des infos sur la station qui intéresse l'user 
				     var refCoord=[e.latlng["lat"],e.latlng["lng"]];
				     stationUser = Object.create(Station); //les infos sur la station choisie seront contenues dans un objet Station

				     //recherche des infos de la station qui intéresse l'user :
				     infosStations.forEach(function(stationRecherche){

				     	if(stationRecherche.position[0]===refCoord[0] && stationRecherche.position[1]===refCoord[1]){

				     		stationUser.init(stationRecherche.ville, stationRecherche.nom, stationRecherche.adresse,
				     			stationRecherche.position,stationRecherche.statut,stationRecherche.placesTotal,
				     			stationRecherche.placesDispo,stationRecherche.velosDispo);	

				     			markerPresent=marker;			
				     	}

				     });
				     
				     //affichage d'infos de la réservation à côté de la carte 
				     affichageInfosReservation(stationUser);
				}
				
				marker.on('click', onMarkerClick); //ajout d'un click listener sur chaque marqueur

				//markercluster : on ajoute les marqueurs au markercluster
				markers.addLayer(marker);
				//----------------------------------------------------------------
			}); 

			//markercluster : ajout du markercluster à notre carte
			mymap.addLayer(markers);

			//fin de notre réponse en cas de succès de la requête ajax
	});


	/*
	**********************************************************************
	-6- Réservation d'un vélo via soumission formulaire et signature canvas
	**********************************************************************
	*/
	//soumission du formulaire (clique sur bouton "Réserver")
	form.addEventListener("submit",function(e){
		e.preventDefault(); //désactivation du comportement par défaut du formulaire

		if(typeof(stationUser)==="object"){ //on vérifie si un objet Station a été créé

			/*on vérifie ensuite si une nouvelle réservation est possible à la station recherchée par l'user :
			 - si station ouverte
			 - et si vélos disponibles
			 */
			 if(Number(stationUser.velosDispo)>0 && stationUser.statut==="OPEN"){
				//affichage de la fenêtre modale avec canvas
				modale.show("slow");
				modale.css("display","flex").css("flex-direction","column").css("justify-content","center").css("align-items","center");
				$("#overlay").css("display","block");
			 }
			 else{
			 	var message="Réservation impossible ";
			 	if(stationUser.statut!=="OPEN"){
			 		message+=", la station est fermée";
			 	}
			 	else{
			 		message+=", aucun vélo disponible";
			 	}
			 	alert(message);
			 }

		}
		else{
			alert("Sélectionnez une station");
		}

	});

	//validation de la réservation (sous canvas)
	$("#valider").click(function(){

			bye();
			/*en cas de changement de réservation : vérification si réservation déjà en cours en vérifiant si marqueur vélo existant, auquel cas:
			 -on supprime le marqueur, 
			 -on arrête la fonction de compte à rebours
			 -on vide les données stockées dans sessionStorage
			 -on retire le popup du marker
			 */

			if(markerTemoin.length!==0){
				markerTemoin.setIcon(defaultIcon);
				chrono.stop(); //on arrête notre fonction de compteur à rebours via l'objet Chrono
				sessionStorage.clear();
			}

			//changer le marqueur pour le remplacer par un marqueur de réservation		
			markerTemoin=markerPresent.setIcon(veloIcon);						

			//affichage des infos de réservation
			var client=form.elements.prenom.value + " " + form.elements.nom.value;
			var message="Vélo réservé à la station " + stationUser.nom + " par " + client;
			confirmation.textContent=message;
			
			duree=60*20; //durée en secondes de la réservation en cours : 20 minutes
			//lancement du chrono et des actions associées au décompte
			chrono.init(duree);
			chrono.start(timeIn,timeOut);

			//Gestion de la conservation des données de réservation via l'API Web Storage
			//instanciation de nos objets Reservation  et stockage de nos objets avec l'API Web Storage
			if (typeof(Storage) !== "undefined") { //on verifie si le navigateur supporte Web Storage

				var reservationLocal=Object.create(ReservationLocal); //construction d'un objet Reservation, qui nous aidera à récupérer les infos de la réservation en cas de départ de l'application
				var reservationSession=Object.create(ReservationSession); //construction d'un objet Reservation, qui nous aidera à récupérer les infos de la réservation en cas de départ de l'application
				
				//on retient en localStorage le nom et prénom
				//on retient en sessionStorage en plus les infos de la station réservée et l'expiration de la réservation
				expTime.init();
				var expiration=expTime.get_expiration_millisecondes(duree); //calcul en millisecondes epoch de l'expiration de la réservation pour nos objets de réservation
				reservationLocal.initResLocal(form.elements.nom.value,form.elements.prenom.value);
	 			reservationSession.initResSession(stationUser,form.elements.nom.value,form.elements.prenom.value,expiration);	

				reservationLocal.saveReservation();
				reservationSession.saveReservation();
			} 

			if (typeof(Storage) === "undefined"){
			    alert("Votre navigateur ne supporte pas la conservation des infos de réservation.");
			}

	});

	//annulation de la réservation (sous canvas)
	$("#annuler").click(function(){
			bye();
	});


	/*
	**********************************************************************************
	-7- FONCTIONS
	**********************************************************************************
	*/

	/*
	**********************************************************************
	fonction vérification de réservation dans Web Storage
	**********************************************************************
	*/

	function checkSessionStorage(){

		// Verification si le navigateur supporte Web Storage
		if (typeof(Storage) !== "undefined") {

		    // Verification si réservation stockée à recupérer, on recherche nom et prénom
		    if(localStorage.getItem('reservation')) { 

		    	//recupération des infos de réservation avec notre objet ReservationLocal
		    	var reservation_json=Object.create(ReservationLocal);
		    	reservation=reservation_json.getReservation();
				
				//complétion du nom et du prénom du client dans le formulaire
				form.elements.nom.value=reservation.nom;
				form.elements.prenom.value=reservation.prenom;
		    }

			//on recherche une durée d'expiration
		    if(sessionStorage.getItem('reservation')){

		    	//recupération des infos de réservation avec notre objet ReservationSession
		    	var reservation_json=Object.create(ReservationSession);
		    	reservation=reservation_json.getReservation();

				//recupération de l'objet Station comprenant toutes les infos sur la station réservée par le client
				stationTport=reservation.station; 

				//affichage des infos de la réservation
				var message="Vélo réservé à la station " + stationTport.nom + " par " + reservation.prenom + " " + reservation.nom;
				confirmation.textContent=message; //affichage des infos de la réservation en cours

				//gestion expiration réservation:
				expTime.init();
				var duree=expTime.get_expiration_secondes(reservation.expiration);
				if(duree>0){ //si >0 on reprend le compte à rebours
					//gestion du compte à rebours avec notre objet Chrono :
					chrono.init(duree);
					chrono.start(timeIn,timeOut);
				}

				else{
					nettoyageExpiration();
				}

		    }
		} 
		else {
		    alert("Votre navigateur ne supporte pas la conservation des infos de réservation.");
		}

	}

	/*
	**********************************************************************
	fonction affichage des infos de réservation à côté de la carte
	**********************************************************************
	*/
	function affichageInfosReservation(station){ //prend en paramètre un objet Station

		legende.textContent=station.getName();
		ligneAdresse.textContent=station.getAddress();
		ligneInfos.innerHTML=station.getAvailableBikes() +"<br/>" + station.getPlaces()
		+"<br/>" + station.getStatus();

	}

	/*
	**********************************************************************
	fonction maj affichage et nettoyage après expiration de la réservation
	**********************************************************************
	*/
	function nettoyageExpiration(){

			chrono.stop(); //on arrête notre fonction de compteur à rebours de notre objet Chrono

	    	decompte.textContent="Réservation expirée";
			//disparition du message au bout de 2 secondes
			setTimeout(function(){
				legende.textContent="Détails de la station";
				ligneAdresse.textContent="Adresse : ";
				ligneInfos.innerHTML="";
				confirmation.textContent=""; 
				decompte.textContent="";
				//remplacement du marqueur
				markerTemoin.setIcon(defaultIcon);
			},2000);

	}

	/*
	**********************************************************************
	fonction disparition de la fenêtre modale et de l'overlay
	**********************************************************************
	*/
	function bye(){
		//disparition modale et sous-couche
		$("#overlay").css("display","none");
		modale.hide("slow");
		//vider canvas
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		//disparition du popup du marker
		mymap.closePopup();
	}

	/*
	**********************************************************************
	fonctions appelées par l'objet Chrono
	**********************************************************************
	*/	
	function timeIn(duree){  //si la réservation est en cours

		    var minutes=0;
		    var secondes=0;
	    	//calcul des minutes et des secondes pour l'affichage
	    	secondes=duree%60;
	    	minutes=(duree-secondes)/60;
	    	var expressionTps="";
	    	if(secondes===0){
	    		expressionTps=minutes + "min ";
	    	}
	    	else if(minutes===0){
	    		expressionTps=secondes + "s ";
	    	}
	    	else{
	    		expressionTps=minutes + "min " + secondes + "s ";
	    	}
	    	decompte.textContent=titreTemps + expressionTps;
	}

	function timeOut(){  //si la réservation est expirée
				nettoyageExpiration();
		    	//suppression de notre objet reservation stocké avec l'API Web Storage
		    	if (typeof(Storage) !== "undefined") {
		    		sessionStorage.clear(); 
		    	}
		    	else {
				    console.log("Désolé, votre navigateur ne supporte pas Web Storage...");
				}    	
		    	//--
		    	legende.style.backgroundColor="white";
		    	//--
	}

//FIN CODE
});





