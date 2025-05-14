import { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [pelicula, setPelicula] = useState('');
  const [peliculasDb, setPeliculasDB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [peliculasRecomendadas, setPeliculasRecomendadas] = useState();
  const [historialBusquedas, setHistorialBusquedas] = useState([]);
  const [posters, setPosters] = useState({});

  const handleInputChange = (e) => {
    setPelicula(e.target.value);
  };

  const handleRecomendation = async (title) => {
    setLoading(true);
  
    try {
      const res = await axios.get(`http://localhost:4000/get/movie/recomendation/${title}`, {
        params: { exclude: historialBusquedas.join(',') }
      });
  
      setPeliculasRecomendadas(res.data);
      setHistorialBusquedas([...historialBusquedas, title]);
      console.log(historialBusquedas);
  
      // Utilizar los posters desde la base de datos que ya contienen el poster_path
      const postersData = {};
      res.data.forEach(movie => {
        if (movie.poster_path) {
          postersData[movie.title] = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        }
      });
      setPosters(postersData);
    } catch (err) {
      console.error("Error al obtener recomendaciones:", err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSearchMovie = async () => {
    if (pelicula.trim() !== '') {
      setLoading(true);
  
      try {
        const res = await axios.get(`http://localhost:4000/get/movie/recomendation/${pelicula}`, {
          params: { exclude: historialBusquedas.join(',') }
        });
  
        setPeliculasRecomendadas(res.data);
        setHistorialBusquedas([...historialBusquedas, pelicula]);
        console.log(historialBusquedas);
  
        // Utilizar los posters desde la base de datos que ya contienen el poster_path
        const postersData = {};
        res.data.forEach(movie => {
          if (movie.poster_path) {
            postersData[movie.title] = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
          }
        });
        setPosters(postersData);
      } catch (err) {
        console.error("Error al obtener recomendaciones:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    setPelicula('');
    setPeliculasRecomendadas();
  };

  useEffect(() => {
    if (peliculasDb.length === 0) {
      axios.get("http://localhost:4000/get/movies")
      .then((res) => {
        setPeliculasDB(res.data);
        console.log(res.data);
      })
      .catch((error) => {
        console.error("Error al obtener las películas:", error);
      })
      .finally(() => {
        setLoading(false); // ocultamos el loading cuando termina
      });
    }
  }, [peliculasDb]);

  return (
    <div className="app">
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {peliculasRecomendadas ? (
            <>
              <nav className="navbar">
                <span className="navbar-title" onClick={handleReset}>Rekko</span>
              </nav>
              <div className="recomendaciones">
              {peliculasRecomendadas.map((movie, index) => (
                <div key={index} className="recomendacion">
                  <p className="recomendacion-title">{movie.title}</p>
                  {posters[movie.title] && (
                    <img className="recomendacion-poster" src={posters[movie.title]} alt={movie.title} />
                  )}
                  <button onClick={() => handleRecomendation(movie.title)} className="boton-recomendar">
                    Generar nueva recomendación
                  </button>
                </div>
              ))}
              </div>
            </>
          ) : (
            <div className="container">
              <h1 className="title">Rekko</h1>
              <input
                type="text"
                list="movies-options"
                placeholder="Introduce el nombre de una película"
                value={pelicula}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchMovie();
                  }
                }}
                className="input"
              />
              <datalist id="movies-options">
                {peliculasDb.map((movie, i) => (
                  <option key={i} value={movie.title} />
                ))}
              </datalist>
            </div>
          )}
        </>
      )}
    </div>
  );  
}

export default App;
