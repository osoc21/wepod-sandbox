import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  fetch
} from "@inrupt/solid-client-authn-browser";

// Import from "@inrupt/solid-client"
import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
  getFile, isRawData, getContentType, getSourceUrl,
  getContainedResourceUrlAll
} from "@inrupt/solid-client";


import { VCARD } from "@inrupt/vocab-common-rdf";

const buttonLogin = document.querySelector("#btnLogin");
const buttonRead = document.querySelector("#btnRead");
const buttonAnything = document.querySelector("#btnAny");
const buttonContainer = document.querySelector("#btnContainer");

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

async function getContainer() {
  const webID = document.getElementById("webID").value;
  const myDataset = await getSolidDataset(webID, { fetch: fetch });

  try {
    // file is a Blob (see https://developer.mozilla.org/docs/Web/API/Blob)
    const container = await getContainedResourceUrlAll(
      myDataset,               // File in Pod to Read
      { fetch: fetch }       // fetch from authenticated session
    );
    console.log(container)
    document.getElementById("labelContents").textContent = container.toString();
  } catch (err) {
    console.log(err);
  }
}

async function readAnything() {
  
// Read file from Pod 
  const webID = document.getElementById("webID").value;
  try {
    // file is a Blob (see https://developer.mozilla.org/docs/Web/API/Blob)
    const file = await getFile(
      webID,               // File in Pod to Read
      { fetch: fetch }       // fetch from authenticated session
    );

    console.log( `Fetched a ${getContentType(file)} file from ${getSourceUrl(file)}.`);
    console.log(`The file is ${isRawData(file) ? "not " : ""}a dataset.`);
    console.log("Contents")
    let contents = await file.text()
    console.log(contents)
    document.getElementById("labelContents").textContent = contents;

  } catch (err) {
    console.log(err);
  }
}
// 2. Read profile
async function readProfile() {
  const webID = document.getElementById("webID").value;

  // The example assumes the WebID has the URI <profileDocumentURI>#<fragment> where
  // <profileDocumentURI> is the URI of the SolidDataset
  // that contains profile data.
  
  // Parse ProfileDocument URI from the `webID` value.
  const profileDocumentURI = webID.split('#')[0];
  document.getElementById("labelProfile").textContent = profileDocumentURI;

  console.log("URI")
  console.log(profileDocumentURI)
  
  // Use `getSolidDataset` to get the Profile document.
  // Profile document is public and can be read w/o authentication; i.e.: 
  // - You can either omit `fetch` or 
  // - You can pass in `fetch` with or without logging in first. 
  //   If logged in, the `fetch` is authenticated.
  // For illustrative purposes, the `fetch` is passed in.
  const myDataset = await getSolidDataset(profileDocumentURI, { fetch: fetch });
  
  console.log("Dataset")
  console.log(myDataset)
  
  // Get the Profile data from the retrieved SolidDataset
  const profile = getThing(myDataset, webID);
  
  console.log("Thing")
  console.log(profile)
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

buttonLogin.onclick = function() {  
  loginToInruptDotCom();
};

buttonRead.onclick = function() {  
  readProfile();
};

buttonAnything.onclick = function() {  
  readAnything();
};

buttonContainer.onclick = function() {  
  getContainer();
};