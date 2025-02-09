const axios = require('axios');

// Función para filtrar solo los campos importantes de una película
const filterDetails = (movie) => {
  return {
    title: movie.title || 'Título no disponible',
    description: movie.overview || 'Descripción no disponible',
    release_date: movie.release_date || 'Fecha no disponible', 
    genres: movie.genres && movie.genres.length > 0 
      ? movie.genres.map(genre => genre.name) 
      : ['Géneros no disponibles'], 
    vote_average: movie.vote_average !== undefined ? movie.vote_average : 'Puntaje no disponible',
    poster_path: movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : "https://via.placeholder.com/500x750?text=No+Image",  // Imagen de respaldo
  };
};


// =================================================
// |  Controlador para listar películas populares  |
// =================================================
const getMovies = async (req, res) => {
  try {
    const apiKey = process.env.API_key;
    const page = req.query.page || 1;

    const language = req.query.lang || 'es-ES';  // Idioma, por defecto en español
    const year = req.query.year;  // Filtro opcional por año de lanzamiento
    const sortBy = req.query.order || 'popularity.desc'; // Orden opcional (por popularidad o fecha)
    
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
        movies.push(...response.data.results);
      } else {
        break; // Se termina si no hay más peliculas.
      }
      currentPage++; // Se pasa a la siguiente página.
    }

    if (movies.length === 0) {
      return res.status(404).json({ status: 'error', msg: 'No se encontraron películas con los filtros seleccionados.' });
    }

    // Filtrar los campos importantes para las 50 primeras películas
    const filteredMovies = movies.slice(0, 50).map(filterDetails);

    res.status(200).json({ status: 'ok', data: filteredMovies }); // Devolver solo las primeras 50 películas con los campos filtrados.
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', msg: 'Error inesperado al obtener la información' });
  }
};

// ================================================
// |  Controlador para listar película por su ID  |
// ================================================
const getMovieById = async (req, res) => {
  try {
    const apiKey = process.env.API_key;
    const movieId = req.params.id;

    // Hacer la solicitud para obtener una película por ID
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
      params: {
        api_key: apiKey,
        language: 'es-ES',
      }
    });

    // Si la película no existe, devolver un error 404
    if (!response.data || response.status === 404) {
      return res.status(404).json({ status: 'error', msg: `No se encontró una película con el ID ${movieId}.` });
    }

    const movie = response.data;

    // Usar la función para filtrar los campos seleccionados.
    const movieDetails = filterDetails(movie);

    // Se devuelve la información si la pelicula existe.
    res.status(200).json({
      status: "ok",
      data: movieDetails,
    });
    // Manejo de errores en caso de que la película no exista o no se encuentre.
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ status: 'error', msg: `No se encontró una película con el ID ${req.params.id}.` });
    }

    console.error(error);
    res.status(500).json({ status: 'error', msg: 'Error inesperado al obtener la información' });
  }
};

// Se exportan las funciones.
module.exports = {
  getMovies,
  getMovieById
};
