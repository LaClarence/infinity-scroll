
const imageContainer = document.getElementById('image-container');
const loader = document.getElementById('loader');

let readyToLoadPhotos = false;
let photosLoaded = 0;
let totalPhotos = 0;
let photos = [];
let apiUrlCountQueryParam = 5;


const API_KEY = '4Dbb6ju-Gyl_z931ljQsG152Q_iCuR5s424qbvfswkI';
const apiUrl = `https://api.unsplash.com/photos/random/?client_id=${API_KEY}&count=${apiUrlCountQueryParam}`;


// Check if all images were loaded
function imageLoaded() {
  photosLoaded++;
  if (photosLoaded === totalPhotos) {
    readyToLoadPhotos = true;
    loader.hidden = true;
  }
}

// Helper method do set photo attributes
function setAttributes(element, attributes) {
  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }
}

// Create elements for links & photos, add to DOM
function displayPhotos() {
  photosLoaded = 0;
  totalPhotos = photos.length;
  photos.forEach((photo) => {
    // Create <a> to link to unsplash
    const item = document.createElement('a');
    setAttributes(item, {
      'href': photo.links.html,
      'target': '_blank'
    });

    // Create figure to manage title of the photo
    const figure = document.createElement('figure');

    const img = document.createElement('img');
    setAttributes(img, {
      'src': photo.urls.regular,
      'alt': photo.alt_description
    });
    // Event Listener, check when each is finished loading
    img.addEventListener('load', imageLoaded);

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = photo.alt_description;

    figure.appendChild(img);
    figure.appendChild(figcaption);
    item.appendChild(figure);
    imageContainer.appendChild(item);

  });
}

// Fetch Photos from UNSPLASH API
const getPhotos = async () => {
  try {
    const response = await fetch(apiUrl);
    photos = await response.json();
    displayPhotos();
  } catch (error) {
    console.log(error);
  }
}

// check to see if scroll near bottom of page, load More photos
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && readyToLoadPhotos) {
    readyToLoadPhotos = false;
    getPhotos();
  }
});

// Load first
getPhotos();
apiUrlCountQueryParam = 30;
