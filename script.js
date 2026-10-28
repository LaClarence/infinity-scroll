const imageContainer = document.getElementById('image-container');
const loader = document.getElementById('loader');
const scrollSentinel = document.getElementById('scroll-sentinel');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const currentTheme = document.getElementById('current-theme');
const statusMessage = document.getElementById('status');

const INITIAL_COUNT = 5;
const NEXT_COUNT = 30;

let isLoading = false;
let isFirstLoad = true;
let query = '';
// Incremented on each new search, so results of an older search are ignored
let searchId = 0;

// Build the Unsplash URL for each call, so the count and the theme can change between calls
const buildApiUrl = (count) => {
  const url = new URL('https://api.unsplash.com/photos/random/');
  const params = new URLSearchParams({ client_id: API_KEY, count, orientation: 'landscape' });
  if (query) params.set('query', query);
  url.search = params;
  return url;
};

// Fetch photos from the Unsplash API
const fetchPhotos = async (count) => {
  const response = await fetch(buildApiUrl(count));
  // Unsplash answers 404 when no photo matches the query
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const showStatus = (message) => {
  statusMessage.textContent = message;
  statusMessage.hidden = false;
};

// Create <a><figure><img><figcaption></figure></a> for one photo
const createPhotoElement = ({ links, urls, alt_description }) => {
  const link = Object.assign(document.createElement('a'), {
    href: links.html,
    target: '_blank',
    rel: 'noopener',
  });
  const img = Object.assign(document.createElement('img'), {
    src: urls.regular,
    alt: alt_description ?? 'Unsplash photo',
  });
  const figcaption = Object.assign(document.createElement('figcaption'), {
    textContent: alt_description ?? '',
  });

  const figure = document.createElement('figure');
  figure.append(img, figcaption);
  link.append(figure);
  return { link, img };
};

// Fetch a batch of photos, add them to the DOM and wait until they are loaded
const loadMorePhotos = async () => {
  if (isLoading) return;
  isLoading = true;
  const currentSearchId = searchId;

  try {
    const photos = await fetchPhotos(isFirstLoad ? INITIAL_COUNT : NEXT_COUNT);
    if (currentSearchId !== searchId) return;
    isFirstLoad = false;

    if (photos.length === 0) {
      loader.hidden = true;
      showStatus(`No photos found for “${query}”.`);
      return;
    }

    const elements = photos.map(createPhotoElement);
    imageContainer.append(...elements.map(({ link }) => link));

    // allSettled: a broken image must not block the infinite scroll
    await Promise.allSettled(elements.map(({ img }) => img.decode()));
    if (currentSearchId !== searchId) return;
    loader.hidden = true;

    // Observe again: if the sentinel is still visible (large screen), the callback fires and loads more
    observer.unobserve(scrollSentinel);
    observer.observe(scrollSentinel);
  } catch (error) {
    console.error(error);
    if (currentSearchId === searchId) {
      loader.hidden = true;
      showStatus('Could not load photos, please try again later.');
    }
  } finally {
    if (currentSearchId === searchId) isLoading = false;
  }
};

// Start over with a new theme (an empty theme goes back to random photos)
const startSearch = (newQuery) => {
  searchId++;
  query = newQuery;
  isLoading = false;
  isFirstLoad = true;

  currentTheme.textContent = query ? `Theme: ${query}` : 'Random photos';
  statusMessage.hidden = true;
  imageContainer.replaceChildren();
  loader.hidden = false;
  window.scrollTo({ top: 0 });

  // Observing triggers a callback, which loads the first batch of the new theme
  observer.unobserve(scrollSentinel);
  observer.observe(scrollSentinel);
};

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  startSearch(searchInput.value.trim());
  searchInput.value = '';
});

// Load more photos when the sentinel at the bottom of the page comes within 1000px of the viewport
const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) loadMorePhotos();
  },
  { rootMargin: '0px 0px 1000px 0px' },
);

// Observing triggers a first callback, which does the initial load
observer.observe(scrollSentinel);
