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
  getStringNoLocale
} from '@inrupt/solid-client';

import { VCARD } from '@inrupt/vocab-common-rdf';



let droppedFiles = [];


const buttonLogin = document.querySelector("#btnLogin");
const buttonRead = document.querySelector("#btnRead");

// 1a. Start Login Process. Call login() function.
function loginToInruptDotCom() {
  return login({

    oidcIssuer: "https://broker.pod.inrupt.com",

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

const MY_POD_URL = "https://pod.inrupt.com/wepodrom/";


// function getPODUrl(provider, pseudo)
// {
//     // TODO: create enums for provider types and urls
//     if (provider == "https://pod.inrupt.com")
//     {
//         return provider + "/" + pseudo + "/";
//     }

//     return null;
// }


// Upload selected files to Pod
function uploadFiles() 
{
    console.log("uploading files ...");
    // const fileList = document.getElementById('file-drop-zone').files;
    for (let file of droppedFiles)
    {
        writeFileToPod(file, `${MY_POD_URL}/${file.name}`, fetch);
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

let dropArea = document.querySelector("#file-drop-zone");
dropArea.addEventListener('drop', handleFileDrop, false);


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

