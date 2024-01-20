import { ComfyUIClient } from './modules/ComfyUIClient.js';
import {auth} from './modules/auth.js';
import {moteur} from './modules/moteur.js';

//Omeka parameters
let a = new auth({'navbar':false,
        mail:'samuel.szoniecky@univ-paris8.fr',
        apiOmk:'http://localhost/omk_genstory_24/api/',
        ident: 'U88iy6ZRDfShexC23K9CGGG0sx6LKYn2',
        key:'XUbZKSuaERYYhy4cIulVbSdItfC1CBMb',        
    });
//omeka connexion
a.getUser(u=>{
    console.log(u);
});

//text generator parameters
let m = new moteur({'apiUrl':'http://localhost/generateur/apiRead.php','id_dico':169,'id_oeu':72}),
    genPrompt = "[prompt_scene]";

//image generator parameter
const serverAddress = '127.0.0.1:8188';
const clientId = '369c21bf688146b1b07e40b519fd7bdf';
const client = new ComfyUIClient(serverAddress, clientId);
let promptModel="", prompt="";

// Connect to image generator
client.connect(start,progress,executed);


//ask image
function getImage(scene){
    //get the prompt
    m.strct=[];
    m.texte="";
    m.genere(genPrompt,true,true);
    prompt = m.texte.replace('#label#',scene.label);
    //prompt = "a beautiful and powerful mysterious sorceress, smile, sitting on a rock, lightning magic, hat, detailed leather clothing with gemstones, dress, castle background, digital art";
    // Set the text prompt for our positive CLIPTextEncode
    promptModel['6'].inputs.text = prompt;
    // Set the seed for our KSampler node
    promptModel['3'].inputs.seed = Math.floor(Math.random() * 4294967294)+ 1;
    //execute the prompt
    const queue = client.queuePrompt(promptModel);    
}

//image generator start
function start(promptId){
    console.log(promptId);
}
//image generator progress
function progress(p){
    d3.select('#progressTiming').text(p.value);
}
//image generator finish
function executed(rs){
    console.log(rs);
    rs.images.forEach(i=>{
        //data for save
        let urlIma = client.getImageUrl(i.filename, i.subfolder, i.type),
            data = {
                "dcterms:title":"test", 
                "dcterms:description":prompt,
                "o:media":urlIma, 
            };
        //save image to omeka
        a.omk.createItem(data,i=>{
            console.log(i);
            showImage(i);
        });
    })
}

function showImage(i){
    d3.select("#imgResult").select('div').remove();
    let divResult = d3.select("#imgResult").append('div');
    divResult.append('h2').text(prompt);    
    divResult.append('img').attr('src',i.thumbnail_display_urls.large);    
}

//get the prompt model
d3.json('assets/data/promptTest.json').then(js=>{
    promptModel = js;
    //generate image
    getImage({'label':'butterfly'});
});
