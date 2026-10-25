const imageContainer = document.getElementById('image-container');
const loader = document.getElementById('loader');
const scrollSentinel = document.getElementById('scroll-sentinel');

const INITIAL_COUNT = 5;
const NEXT_COUNT = 30;

let isLoading = false;
let isFirstLoad = true;

// Build the Unsplash URL for each call, so the count can change between calls
const buildApiUrl = (count) => {
  const url = new URL('https://api.unsplash.com/photos/random/');
  url.search = new URLSearchParams({ client_id: API_KEY, count });
  return url;
};

// Fetch photos from the Unsplash API
const fetchPhotos = async (count) => {
  const response = await fetch(buildApiUrl(count));
  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
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

  try {
    const photos = await fetchPhotos(isFirstLoad ? INITIAL_COUNT : NEXT_COUNT);
    isFirstLoad = false;

    const elements = photos.map(createPhotoElement);
    imageContainer.append(...elements.map(({ link }) => link));

    // allSettled: a broken image must not block the infinite scroll
    await Promise.allSettled(elements.map(({ img }) => img.decode()));
    loader.hidden = true;

    // Observe again: if the sentinel is still visible (large screen), the callback fires and loads more
    observer.unobserve(scrollSentinel);
    observer.observe(scrollSentinel);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading = false;
  }
};

// Load more photos when the sentinel at the bottom of the page comes within 1000px of the viewport
const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) loadMorePhotos();
  },
  { rootMargin: '0px 0px 1000px 0px' },
);

// Observing triggers a first callback, which does the initial load
observer.observe(scrollSentinel);
