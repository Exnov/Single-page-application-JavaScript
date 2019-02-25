$(function(){
//DEBUT CODE

	/* 
	*************************************************************************************
	DIAPORAMA
	-déclaration de variables
	-définition d'objets
	-création d'objets
	************************************************************************************* 
	*/

	/*
	**********************************************************************
	déclaration de variables et sélection d'élts dans le DOM
	**********************************************************************
	*/
	var chevronG=document.querySelector("#chevron_g");
	var chevronD=document.querySelector("#chevron_d");
	var image=document.querySelector("#slide"); //balise img
	var legendeDiapo=document.querySelector("figcaption");
	var legendes="";
	var player=document.querySelector("#player");
	var logoPlayer=document.querySelector("#diapo"); 
	var diapoAuto=""; //contiendra la fonction de défilement auto
	var diapo1, diapo2, diapo3, diapo3, diapo4, diapo4; //contiendront les diapos
	var diapos=""; //contiendra les objets Diapo


	/*
	**********************************************************************
	définition d'objets
	1- Diapo
	2- Slider
	**********************************************************************
	*/

	/*
	**********************************************************************
	définition objet Diapo
	**********************************************************************
	*/
	var Diapo={
		//initialise la diapo
		init: function(url){
			this.url=url;
		}
	};

	/*
	**********************************************************************
	définition objet Slider
	**********************************************************************
	*/
	var Slider={
		//initialise la diapo
		init: function(slider,diapos,legendeDiapo,chevronG,chevronD,player,logoPlayer){

			this.slider=slider;
			this.diapos=diapos;
			this.legendeDiapo=legendeDiapo;
			this.legendeDiapo.textContent="1/"+diapos.length;
			this.chevronG=chevronG;
			this.chevronD=chevronD;
			this.player=player;
			this.logoPlayer=logoPlayer;
			this.diapoAuto=diapoAuto;
			this.vitesse=5000; //5 secondes
		},
		/*
		**********************************************************************
		calcul l'index de l'url image à récupérer dans le tableau d'objets "diapos"
		**********************************************************************
		*/
		calculIndexImage:function(){
			var urlImage=this.slider.src;
			var numeroImage=urlImage.charAt(urlImage.length-5); 
			var index=numeroImage-1;
			return index;
		},
		/*
		**********************************************************************
		affichage de l'image et du décompte d'image pour déplacement user et défilement auto selon type de direction
		**********************************************************************
		*/
		direction:function(slug,objet){

			var index=objet.calculIndexImage();
			var slide=$(objet.slider);

			slide.fadeOut(500,function(){				

					switch(slug){
						case "gauche":
							if(index!==0){
								index-=1;
							}
							else{
								index=objet.diapos.length-1;
							}
							break;
						case "droite":
							if(index!==(objet.diapos.length-1)){ 
								index+=1;
							}
							else{
								index=0;
							}
							break;
						case "auto":
							if(index!==(objet.diapos.length-1)){ 
								index+=1;
							}
							else{
								index=0;
							}
							break;
						default:
							break;
					}
					objet.slider.src=objet.diapos[index].url;
					objet.legendeDiapo.textContent=(index+1) + "/" + objet.diapos.length;
					slide.fadeIn(500);
				
			});
		
		},
		/*
		**********************************************************************
		déplacement des diapos par l'user
		**********************************************************************
		*/
		lancerDeplacement:function(){
			
			var objet=this;

			//-à gauche :
			this.chevronG.addEventListener("click",function(e){
				e.preventDefault();
				objet.direction("gauche",objet);
			});
			//-à droite :
			this.chevronD.addEventListener("click",function(e){
				e.preventDefault();
				objet.direction("droite",objet);
			});

			//-fléches dans page :
			document.addEventListener("keydown", function (e) { 
			    var touche=e.keyCode;
			    var toucheGauche=37;
				var toucheDroite=39;
			    //-à gauche :
			    if(touche==toucheGauche){
			    	objet.direction("gauche",objet);
			    }
			    //-à droite :
			    else if(touche==toucheDroite){
			    	objet.direction("droite",objet);
			    }
			});
			
		},
		/*
		**********************************************************************
		défilement auto du diaporama
		**********************************************************************
		*/
		lancerDefilementAuto:function(){

			var objet=this;
			this.diapoAuto = setInterval(defilement,this.vitesse);

			this.player.addEventListener("click",function(e){

				e.preventDefault();
				
				var classe=objet.logoPlayer.className;
				var nouvelleClasse="";

				if(classe==="fas fa-pause"){
					nouvelleClasse="fas fa-play";
					clearInterval(objet.diapoAuto);
				}
				else if(classe==="fas fa-play"){
					nouvelleClasse="fas fa-pause";
					objet.diapoAuto = setInterval(defilement,objet.vitesse);		
				}
				objet.logoPlayer.className=nouvelleClasse;

			});

			//-function de défilement automatique du diapo :
			function defilement(){
				objet.direction("auto",objet);
			}

		}
		
	};
	/*
	**********************************************************************
	fin définition objet slider
	**********************************************************************
	*/


	/*
	**********************************************************************
	création d'objets
	1- Diapo
	2- Slider
	**********************************************************************
	*/

	/*
	**********************************************************************
	instanciation de notre tableaux d'objets Diapo à fournir à notre objet Slider
	**********************************************************************
	*/
	//création de 6 objets Diapo
	diapo1=Object.create(Diapo);
	diapo1.init("images/1.jpg");

	diapo2=Object.create(Diapo);
	diapo2.init("images/2.jpg");

	diapo3=Object.create(Diapo);
	diapo3.init("images/3.jpg");

	diapo4=Object.create(Diapo);
	diapo4.init("images/4.jpg");

	//insertion des objets Diapo dans un tableau
	diapos=[diapo1,diapo2,diapo3,diapo4];


	/*
	**********************************************************************
	instanciation de notre objet slider, et mise en place du sldier
	**********************************************************************
	*/
	var slider=Object.create(Slider);
	slider.init(image,diapos,legendeDiapo,chevronG,chevronD,player,logoPlayer);
	slider.lancerDeplacement();
	slider.lancerDefilementAuto();

//FIN CODE
});