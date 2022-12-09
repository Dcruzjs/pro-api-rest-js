const api = axios.create({
   baseURL: BASE_URL,
   headers:{
    'Content-Type': 'application/json;charset=utf-8',
   },
   params:{
    'api_key': API_KEY,
    'language': navigator.language || "es-ES"
   }
});
let maxPages;

function likedMoviesList() {
  const item = JSON.parse(localStorage.getItem('liked_movies'));
  let movies;

  if (item) {
    movies = item;
  } else {
    movies = {};
  }
  
  return movies;
}

function likeMovie(movie) {
  // movie.id
  const likedMovies = likedMoviesList();

  if (likedMovies[movie.id]) {
    likedMovies[movie.id] = undefined;
  } else {
    likedMovies[movie.id] = movie;
  }

  localStorage.setItem('liked_movies', JSON.stringify(likedMovies));
}

const lazyLoader = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const url = entry.target.getAttribute('data-img')
      entry.target.setAttribute('src', url);
    }
  });
});

function createMovies(
  movies, 
  container, 
  {
    lazyLoad = false,
    clean = true,
  } = {}){
  if (clean) {
    container.innerHTML = '';
  }

  let domMovies = movies.map(movie => {
      const movieContainer = document.createElement('div');
      movieContainer.classList.add('movie-container');
      
      const movieImg = document.createElement('img');
      movieImg.addEventListener('click', ()=>{
        location.hash ='movie='+movie.id;
      })
      movieImg.classList.add('movie-img');
      movieImg.setAttribute('alt', movie.title);
      
      movieImg.setAttribute(
        lazyLoad ? 'data-img' : 'src',
        'https://image.tmdb.org/t/p/w300' + movie.poster_path,
        );
      // movieImg.addEventListener('error', () => {
      //   movieImg.setAttribute('src', '../images.png')
      // })
      const movieBtn = document.createElement('button');
      movieBtn.classList.add('movie-btn');
      likedMoviesList()[movie.id] && movieBtn.classList.add('movie-btn--liked');
      movieBtn.addEventListener('click', () => {
      movieBtn.classList.toggle('movie-btn--liked');
      
      likeMovie(movie);
      getLikedMovies();
      });
      if (lazyLoad) {
        lazyLoader.observe(movieImg);
      }
      movieContainer.appendChild(movieImg);
      movieContainer.appendChild(movieBtn);
      
      return movieContainer;
    });
    
    container.append(...domMovies);
  
}

function createCategories(categories, container){

  const domCategories = categories.map(category => {
      const categoryContainer = document.createElement('div');
      categoryContainer.classList.add('category-container');

      const categoryTag = document.createElement('h3');
      categoryTag.classList.add('category-title');
      categoryTag.addEventListener('click', ()=>{
        location.hash = `#category=${category.id}-${category.name}`
      })
      categoryTag.setAttribute('id', `id${category.id}`);
      const text = document.createTextNode(category.name);
      categoryTag.appendChild(text);
      categoryContainer.appendChild(categoryTag)
      return categoryContainer;
    });
    
    container.innerHTML='';
    container.append(...domCategories);
}

async function getTrendingMoviesPreview(){
  
  try {
    let {data} = await api('/trending/movie/day');
    
    createMovies(data.results, trendingMoviesPreviewList, true)
    
  } catch (error) {
    console.log(error)
  }
}

async function getMoviesByCategory(id){

  try {
    let {data} = await api(`/discover/movie`,{
    params: {
      with_genres: id,
    },
  });

    createMovies(data.results, genericSection, true);
    
  } catch (error) {
    console.log(error);
  }
}

async function getCategoriesPreview(){
  
  try {
    let {data} = await api('/genre/movie/list');
    
    createCategories(data.genres,categoriesPreviewList)
  } catch (error) {
    console.log(error)
  }
}

async function getMoviesBySearch(query) {
  try {
    const { data } = await api('search/movie', {
      params: {
        query,
      },
    });
    const movies = data.results;
  
    createMovies(movies, genericSection, true);
    
  } catch (error) {
    console.log(error.response.data.errors)
  }
}

async function getMoviesById(movieId){
  
  try {
    let {data: movie} = await api('/movie/'+movieId);

    const movieImgUrl = 'https://image.tmdb.org/t/p/w500/' + movie.poster_path

    headerSection.style.background = `
    linear-gradient(
      180deg,
      rgba(0,0,0,0.35) 19.27%,
      rgba(0,0,0,0) 29.17%
    ),
    url(${movieImgUrl})`
    
    movieDetailTitle.textContent = movie.title;
    movieDetailDescription.textContent = movie.overview,
    movieDetailScore.textContent= movie.vote_average;

    createCategories(movie.genres, movieDetailCategoriesList);
    getRelatedMoviesById(movieId);
    
  } catch (error) {
    console.log(error)
  }
}

async function getRelatedMoviesById(movieId){
  
  try {
    let {data} = await api(`/movie/${movieId}/recommendations`);

    createMovies(data.results, relatedMoviesContainer)

    
  } catch (error) {
    console.log(error)
  }
}

async function getTrendingMovies(){
  
  try {
    let {data} = await api('/trending/movie/day');
    maxPages = data.total_pages;
    createMovies(data.results, genericSection)
    
  } catch (error) {
    console.log(error)
  }

  // const btnLoadMore = document.createElement('button');
  // btnLoadMore.innerText = 'Cargar más';
  // btnLoadMore.addEventListener('click', getPaginatedTrendingMovies);
  // genericSection.appendChild(btnLoadMore);
}

let page = 1;

async function getPaginatedTrendingMovies() {
  const {
    scrollTop,
    scrollHeight,
    clientHeight
  } = document.documentElement;
  
  const scrollIsBottom = (scrollTop + clientHeight) >= (scrollHeight - 15);
  const pageIsNotLastOne = page < maxPage;
  if (scrollIsBottom && pageIsNotLastOne) {
    page++;
    const { data } = await api('trending/movie/day', {
      params: {
        page,
      },
    });
    const movies = data.results;

    createMovies(
      movies,
      genericSection,
      { lazyLoad: true, clean: false },
    );
  }

  // const btnLoadMore = document.createElement('button');
  // btnLoadMore.innerText = 'Cargar más';
  // btnLoadMore.addEventListener('click', getPaginatedTrendingMovies);
  // genericSection.appendChild(btnLoadMore);

}

function getLikedMovies() {
  const likedMovies = likedMoviesList();
  const moviesArray = Object.values(likedMovies);

  createMovies(moviesArray, likedMoviesListArticle, { lazyLoad: true, clean: true });
  
  console.log(likedMovies)
}
