// Import from "@inrupt/solid-client-authn-browser"
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  fetch
} from '@inrupt/solid-client-authn-browser';

// Import from "@inrupt/solid-client"
import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
  // write data
  setThing,
  saveSolidDatasetAt,
  // added to upload image to pod
  saveFileInContainer, 
  getSourceUrl,
  setStringNoLocale
} from '@inrupt/solid-client';

import {FOAF, VCARD } from '@inrupt/vocab-common-rdf';



let droppedFiles = [];
let MY_POD_URL = null;


const buttonLogin = document.querySelector("#btnLogin");
const buttonRead = document.querySelector("#btnRead");

// 1a. Start Login Process. Call login() function.
function loginToInruptDotCom() {
  return login({

    //oidcIssuer: "https://broker.pod.inrupt.com",
    oidcIssuer: "https://solidweb.org/",

    redirectUrl: window.location.href,
    clientName: "Getting started app"
  });
}

// 1b. Login Redirect. Call handleIncomingRedirect() function.
// When redirected after login, finish the process by retrieving session information.
async function handleRedirectAfterLogin() {
  await handleIncomingRedirect();

  const session = getDefaultSession();
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    document.getElementById("labelStatus").textContent = "Your session is logged in.";
    document.getElementById("labelStatus").setAttribute("role", "alert");
  }
}

// The example has the login redirect back to the index.html.
// This calls the function to process login information.
// If the function is called when not part of the login redirect, the function is a no-op.
handleRedirectAfterLogin();

// 2. Read profile
async function readProfile() {
  const webID = document.getElementById("webID").value;
  MY_POD_URL = getPODUrl(webID);

  // The example assumes the WebID has the URI <profileDocumentURI>#<fragment> where
  // <profileDocumentURI> is the URI of the SolidDataset
  // that contains profile data.
  
  // Parse ProfileDocument URI from the `webID` value.
  const profileDocumentURI = webID.split('#')[0];
  document.getElementById("labelProfile").textContent = profileDocumentURI;


  // Use `getSolidDataset` to get the Profile document.
  // Profile document is public and can be read w/o authentication; i.e.: 
  // - You can either omit `fetch` or 
  // - You can pass in `fetch` with or without logging in first. 
  //   If logged in, the `fetch` is authenticated.
  // For illustrative purposes, the `fetch` is passed in.
  const myDataset = await getSolidDataset(profileDocumentURI, { fetch: fetch });

  // Get the Profile data from the retrieved SolidDataset
  const profile = getThing(myDataset, webID);

  // Get the formatted name using `VCARD.fn` convenience object.
  // `VCARD.fn` includes the identifier string "http://www.w3.org/2006/vcard/ns#fn".
  // As an alternative, you can pass in the "http://www.w3.org/2006/vcard/ns#fn" string instead of `VCARD.fn`.
 
  const fn = getStringNoLocale(profile, VCARD.fn);

  // Get the role using `VCARD.role` convenience object.
  // `VCARD.role` includes the identifier string "http://www.w3.org/2006/vcard/ns#role"
  // As an alternative, you can pass in the "http://www.w3.org/2006/vcard/ns#role" string instead of `VCARD.role`.

  const role = getStringNoLocale(profile, VCARD.role);

  // Update the page with the retrieved values.
  document.getElementById("labelFN").textContent = fn;
  document.getElementById("labelRole").textContent = role;
}



let uploadBtn = document.querySelector("#upload-file-btn");
uploadBtn.onclick = function(){
    uploadFiles();
}



const solidwebPattern = "https:\/\/(\w+\.)solidweb.org\/";
const podInruptPattern = "https:\/\/pod\.inrupt\.com\/\w+\/";

const tempPodPattern = /https:\/\/(\w+\.)solidweb.org\/|https:\/\/pod\.inrupt\.com\/\w+\//;

 function getPODUrl(provider)
{

  const podURL = provider.match(tempPodPattern)[0];
  return podURL;
    // TODO: create enums for provider types and urls
    /*
    if (provider == "https://pod.inrupt.com")
    {
        return provider + "/" + pseudo + "/";
    }
    */

}


// Upload selected files to Pod
function uploadFiles() 
{
    console.log("uploading files ...");
    // const fileList = document.getElementById('file-drop-zone').files;
    for (let file of droppedFiles)
    {
      placeFileInContainer(file, `${MY_POD_URL}`);
        //writeFileToPod(file, `${MY_POD_URL}/${file.name}`, fetch);
    }
}

// Upload File to the targetFileURL.
// If the targetFileURL exists, overwrite the file.
// If the targetFileURL does not exist, create the file at the location.
async function writeFileToPod(file, targetFileURL, fetch ) 
{
    console.log("writing", file.name, "to the POD ...");
    try 
    {
        const savedFile = await overwriteFile(  
            targetFileURL,                              // URL for the file.
            file,                                       // File
            { contentType: file.type, fetch: fetch }    // mimetype if known, fetch from the authenticated session
        );
        console.log(`File saved at ${getSourceUrl(savedFile)}`);
    } 
    catch (error) 
    {
        console.error(error);
    }
}

// Upload file into the targetContainer.
async function placeFileInContainer(file, targetContainerURL) {
  try {
  const savedFile = await saveFileInContainer(
      targetContainerURL,           // Container URL
      file,                         // File 
      { slug: file.name.split('.')[0], 
        contentType: file.type, fetch: fetch }
  );
  console.log(`File saved at ${getSourceUrl(savedFile)}`);
  } catch (error) {
  console.error(error);
  }
}

let dropArea = document.querySelector("#file-drop-zone");
dropArea.addEventListener('drop', handleFileDrop, false);
let previewArea = document.getElementById("preview-zone");


function handleFileDrop(e)
{
    // e.preventDefault();
    if(e.dataTransfer && e.dataTransfer.files.length != 0)
    {
        droppedFiles = e.dataTransfer.files; //Array of filenames
        console.log("dropped file(s):");
        for (let file of droppedFiles)
        {
            console.log(file.name);
            //img_preview.src = URL.createObjectURL(file);
            let img_el = document.createElement("img");
            img_el.src = URL.createObjectURL(file);
            img_el.classList.add("img-thumbnail");
            previewArea.appendChild(img_el);


        }
    }
    else
    {
        console.error("drag and drop not supported");
    }

    console.log(e);
    // return false;
}



['dragenter', 'dragover', 'dragleave'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false)
});

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight()
{
  dropArea.classList.add('drop-zone-hover');
}

function unhighlight()
{
  dropArea.classList.remove('drop-zone-hover');
}

function preventDefaults (e) {
  e.preventDefault()
  e.stopPropagation()
}


buttonLogin.onclick = function() {  
  loginToInruptDotCom();
};

buttonRead.onclick = function() {  
  readProfile();
};

// const uploadBtn = document.querySelector("#upload-file-btn");

