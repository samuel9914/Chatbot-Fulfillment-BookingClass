// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');		//me-load Cloud Function untuk firebase SDK
const admin = require('firebase-admin');			//me-load Firebase Admin SDK untuk mengakses Firebase Realtime Database
const {WebhookClient} = require('dialogflow-fulfillment');	//include dialogflow-fulfillmen library
const {Card, Suggestion} = require('dialogflow-fulfillment');	
const fetch = require("node-fetch");				//me-load modul Fetch API yang digunakan untuk melaksanakan HTTP Request
var os = require("os");

admin.initializeApp({						//inisiasi hubungan aplikasi chatbot ke realtime database
  
  	credential: admin.credential.applicationDefault(),
  	databaseURL: 'ws://newagent-ycgelw.firebaseio.com/'
  
  
});
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => { //berisi semua fungsi yang bersangkutan dengan intent pada chatbot
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {	//fungsi akan tereksekusi ketika input dari user tidak dimengerti oleh chatbot
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
    agent.add(`I think its a typo`);
    agent.add(`Use a proper english please`);
    agent.add(`What is that`);
  }
    function capitalizeFirstLetter(words){	//membuat huruf pertama menjadi huruf kapital
    return  (words[0].toUpperCase() + words.slice(1).toLowerCase());
    
  }
  
  let borrowData = { 	//objek untuk menampung informasi seputar peminjaman kelas
  	hari2:'',
    kelas2:'',
 //   jam2:'',
    nama2:'',
    npm2:''
  };
  
  
  function hello(agent){	//fungsi tereksekusi ketika user menyapa chatbot
    agent.add("Hello I am Booker, i can check and book a classroom for you. If you need my help to borrow a classroom, you can type 'help'.");
  }
  
  function HandleBorrowClass(agent){		// tereksekusi ketika input dari user memiliki intensi untuk meminjam kelas
    

  	
      borrowData.kelas2 = agent.parameters.Kelas;	//mengekstrak informasi dari input user dan memasukannya keobjek borrowData
     
    
      borrowData.tanggal2= agent.parameters.Tanggal;
      //borrowData.jam2 = agent.parameters.jamMulai;
      borrowData.nama2 = agent.parameters.Nama;
      borrowData.npm2 = agent.parameters.NPM;
      borrowData.desc2= agent.parameters.Desc;
    
    var jamMulai = agent.parameters.jamMulai;
    var jamSelesai = agent.parameters.jamSelesai;
    capitalizeFirstLetter(borrowData.kelas2);
  
    capitalizeFirstLetter(borrowData.nama2);
    
    agent.context.set({				//membuat konteks yang berisi informasi dan akan dipass fungsi HandleBorrowClassYes
              name: 'testtest',
              lifespan: 1,
              parameters:{Nama: borrowData.nama2,
                         jamMulai: jamMulai,
                         jamSelesai: jamSelesai,
                         Tanggal:  borrowData.tanggal2,
                         Kelas: borrowData.kelas2,
                         //Jam :borrowData.jam2,
                         Npm: borrowData.npm2,
                         Desc: borrowData.desc2}
            });
    
    //menanyakan konfimasi atas informasi yang diberikan oleh user
    agent.add("Confirm booking "+ borrowData.kelas2 +" at "+ jamMulai.split('T')[1].split('+')[0] +" to "+jamSelesai.split('T')[1].split('+')[0]+' at '+borrowData.tanggal2.split('T')[0]  +  " as " + borrowData.nama2 +" with NPM "+borrowData.npm2 + " for "+ borrowData.desc2 + " (yes/no)");
  
    
  }
  
 
  
  
  function HandleBorrowClassYes(){				//tereksekusi ketika user memasukan 'yes' ketika konfirmasi
    
	//mengambil informasi dari konteks yang sudah dibuat
    let kelas = agent.context.get('testtest').parameters.Kelas;
    let tanggal = agent.context.get('testtest').parameters.Tanggal.split('T')[0];
    let jamMulai = agent.context.get('testtest').parameters.jamMulai.split('T')[1].split('+')[0];
    let jamSelesai = agent.context.get('testtest').parameters.jamSelesai.split('T')[1].split('+')[0];
    let nama = agent.context.get('testtest').parameters.Nama;
    let npm = agent.context.get('testtest').parameters.Npm;
    let desc = agent.context.get('testtest').parameters.Desc;
 
   
    var id_temp;
  	return admin.database().ref("id_ref/id").once('value').	//referensi ke id yang pada pada Real Time Database
    	then((snapshot) => {
      
  	  id_temp = snapshot.val();
          id_temp++;						//Auto increment id request
    	  agent.add('Request has been listed '+id_temp);	//pesan bahwa requestnya berhasil serta menampilkan id request dari user
          admin.database().ref('id_ref').set({id:id_temp});
	
		//mengambil data dari konteks
        //let reftanggal = agent.context.get('testtest').parameters.Tanggal.split('T')[0];
    	let kelas = agent.context.get('testtest').parameters.Kelas;
        //let tanggal = reftanggal.split('-')[2]+'-'+reftanggal.split('-')[1]+'-'+reftanggal.split('-')[0];
    //	let jam = agent.context.get('testtest').parameters.Jam.split('T')[1].split('+')[0];
    	let nama = agent.context.get('testtest').parameters.Nama;
    	let npm = agent.context.get('testtest').parameters.Npm;
    	let desc = agent.context.get('testtest').parameters.Desc;
          
	
		
        const Url='http://map.or.id/titip/ccis/L';		//target URL untuk HTTP request

		//memasukan informasi seputar peminjaman kelas kedalam form data
        var FormData = require('form-data');
        var formdata = new FormData();
        formdata.append("key",npm);
        formdata.append("a",kelas);
        //formdata.append("b",tanggal + ' ' +jam);
		
        let formdata2 = new FormData();
        formdata2.append("date","0");
        formdata2.append("time_start","1");
        formdata2.append("time_end","2");
        formdata2.append("capacity","3");
        const otherPram2 ={	//Parameter lain yang digunakan apda http request
		
		//body: formdata2,
		mode: 'cors',
		credentials:'omit',
		method:'GET'	
		};
      	
		
        let url22 ='https://testcheckclass.000webhostapp.com/L/setReq?id='+id_temp+'&name="'+nama+'"&date="'+tanggal+'"&time_start="'+jamMulai+'"&time_end="'+jamSelesai+'"'+'&NPM="'+npm+'"&desc="'+desc+'"&classroom="'+kelas+'"';
      console.log(url22)  ;
      fetch(url22,otherPram2).then(response => {		//melakukan http request menggunakan fetch API
        
	    return response.json();
	
		})
		.then(json => {
          console.log(json.keterangan);
          //console.log(JSON.stringify(json));
		});
      
      
      
        const otherPram ={	//Parameter lain yang digunakan apda http request
		
		body: formdata,
		mode: 'cors',
		credentials:'omit',
		method:'POST'	
		};
         
        console.log(formdata );	//untuk memonitor apakah pengiriman datanya sesuai
          
        
    fetch(Url,otherPram).then(response => {		//melakukan http request menggunakan fetch API
        
	return response.text();
	
	})
	.then(text => {console.log(text);
	});
          
     admin.database().ref('booking list'+ '/' +'Booker_'+ id_temp).set({	//memasukan data ke Real Time Database (Firebase)
      
   			
      		kelas:kelas,
      		//jam:jam,
            tanggal: tanggal,
       		jamMulai:jamMulai,
       		jamSelesai:jamSelesai,
      		nama:nama,
      		npm:npm,
          	desc:desc,
          	id: id_temp,
       
      		Result:'Waiting for admin permission'
      
    	});
      
    });
     

  }
  

  
  function HandleShowAllAvailableClass(agent){
    let timeStart = agent.parameters.timeStart.date_time;
    console.log("pertama "+ timeStart);
    let timeStart2= timeStart.split('T');
    console.log("kedua "+ timeStart2);
    let timeEnd = agent.parameters.timeEnd.date_time; 
    let timeEnd2= timeEnd.split('T');
    let capacity = agent.parameters.capacity;
    let startClock = timeStart2[1].split('+');
    let endClock= timeEnd2[1].split('+');
    
   	
 	const url1= 'https://testcheckclass.000webhostapp.com/L/get?date="'+timeStart2[0]+'"&time_start="'+startClock[0]+'"&time_end="'+endClock[0]+'"&capacity="'+ capacity+'"';
    console.log('the URL '+ url1);
    
    const otherPram2 ={	//Parameter lain yang digunakan apda http request
		
		//body: formdata2,
		mode: 'cors',
		credentials:'omit',
		method:'GET'	
		};
     	
      var replys;
       return fetch(url1,otherPram2).then(response => {		//melakukan http request menggunakan fetch API
        
	    return response.json();
	
		})
		.then(json => {
          console.log("inidia");
        
          //replys = JSON.stringify(json);
          //replys=json.name;
          //console.log(json.name);
         
          
          	
         if(json.name){
         	console.log(json.name);
          	agent.add(  json.name+' with code '+ json.code + ', included '+ json.facility);
          	console.log('akhir');
         }
         else if (json.keterangan == 'noClassMeetsCapacity'){
         	agent.add('No classroom meets the estimated capacity');
         }
         else{
         	agent.add('No classroom meets the requested time');
         }
          
		});
       
    
    
    
  }
  

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
 // intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('borrowClass',HandleBorrowClass);
  intentMap.set('borrowClassYes',HandleBorrowClassYes);
 // intentMap.set('CheckClass',HandleCheckClass);
  intentMap.set('hello',hello);
  intentMap.set('ShowAllAvailableClass',HandleShowAllAvailableClass);
  agent.handleRequest(intentMap);
});

