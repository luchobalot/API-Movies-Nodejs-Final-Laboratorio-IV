const axios = require('axios');

// Función para filtrar solo los campos importantes de una película
const filterDetails = (movie) => {
  return {
    title: movie.title || 'Título no disponible',
    description: movie.overview || 'Descripción no disponible',
    release_date: movie.release_date || 'Fecha no disponible', 
    genres: movie.genres || ['Géneros no disponibles'],
    vote_average: movie.vote_average !== undefined 
      ? Number(movie.vote_average.toFixed(1)) 
      : 'Puntaje no disponible',
    poster_path: movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : "https://via.placeholder.com/500x750?text=No+Image",  // Imagen de respaldo
  };
};

// Función para obtener la lista completa de géneros de TMDB
const getGenres = async (apiKey, language = 'es-ES') => {
  try {
    const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
      params: {
        api_key: apiKey,
        language: language
      }
    });
    return response.data.genres;
  } catch (error) {
    console.error('Error obteniendo géneros:', error);
    return [];
  }
};

// Función para convertir IDs de géneros a sus nombres correspondientes
const mapGenresToNames = (genreIds, genresList) => {
  if (!genreIds || !genresList || !Array.isArray(genreIds)) return ['Géneros no disponibles'];
  return genreIds.map(id => {
    const genre = genresList.find(g => g.id === id);
    return genre ? genre.name : 'Género desconocido';
  }).filter(name => name !== 'Género desconocido');
};

// =================================================
// |  Controlador para listar películas populares  |
// =================================================
const getMovies = async (req, res) => {
  try {
    const apiKey = process.env.API_key;
    const page = req.query.page || 1;
    const language = req.query.lang || 'es-ES';
    const year = req.query.year;
    const sortBy = req.query.order || 'popularity.desc'; // Orden opcional (por popularidad o fecha)
    
    // Obtener lista de géneros primero
    const genresList = await getGenres(apiKey, language);
    
    const movies = [];
    let currentPage = page;

    while (movies.length < 50) {
      const response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
        params: {
          api_key: apiKey,
          language: language,
          page: currentPage,
          primary_release_year: year, // Filtro por año de lanzamiento
          sort_by: sortBy, // Filtro de orden
          include_adult: false, // Excluir películas para adultos
        }
      });

      // Agregar películas si existen resultados
      if (response.data.results && response.data.results.length > 0) {
        // Mapear géneros para cada película
        const moviesWithGenres = response.data.results.map(movie => ({
          ...movie,
          genres: mapGenresToNames(movie.genre_ids, genresList)
        }));
        movies.push(...moviesWithGenres);
      } else {
        break; // Se termina si no hay más películas
      }
      currentPage++; // Se pasa a la siguiente página
    }

    if (movies.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        msg: 'No se encontraron películas con los filtros seleccionados.' 
      });
    }

    // Filtrar los campos importantes para las 50 primeras películas
    const filteredMovies = movies.slice(0, 50).map(filterDetails);

    res.status(200).json({ status: 'ok', data: filteredMovies }); // Devolver solo las primeras 50 películas con los campos filtrados
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status: 'error', 
      msg: 'Error inesperado al obtener la información' 
    });
  }
};

// ================================================
// |  Controlador para listar película por su ID  |
// ================================================
const getMovieById = async (req, res) => {
  try {
    const apiKey = process.env.API_key;
    const movieId = req.params.id;
    const language = req.query.lang || 'es-ES';

    // Obtener lista de géneros primero
    const genresList = await getGenres(apiKey, language);

    // Hacer la solicitud para obtener una película por ID
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
      params: {
        api_key: apiKey,
        language: language,
      }
    });

    // Si la pelicula no existe, devolver un error 404
    if (!response.data || response.status === 404) {
      return res.status(404).json({ 
        status: 'error', 
        msg: `No se encontró una película con el ID ${movieId}.` 
      });
    }

    // Si la peli viene con genre_ids en lugar de genres, se mapean los generos
    const movieWithGenres = {
      ...response.data,
      genres: response.data.genres 
        ? response.data.genres.map(genre => genre.name)
        : mapGenresToNames(response.data.genre_ids, genresList)
    };

    // Usar la función para filtrar los campos seleccionados
    const movieDetails = filterDetails(movieWithGenres);

    // Se devuelve la información si la película existe
    res.status(200).json({
      status: "ok",
      data: movieDetails,
    });
  } catch (error) {
    // Manejo de errores en caso de que la película no exista o no se encuentre
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ 
        status: 'error', 
        msg: `No se encontró una película con el ID ${req.params.id}.` 
      });
    }

    console.error(error);
    res.status(500).json({ 
      status: 'error', 
      msg: 'Error inesperado al obtener la información' 
    });
  }
};

// Se exportan las funciones
module.exports = {
  getMovies,
  getMovieById
};