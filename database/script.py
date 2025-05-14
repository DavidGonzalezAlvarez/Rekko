import csv
import time
import requests
from neo4j import GraphDatabase
from dotenv import load_dotenv
import os
import re

# Cargar variables de entorno del archivo .env
load_dotenv()

# Variables de entorno para la conexión a Neo4j y TMDb
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "neo4jpassword"
TMDB_API_KEY = "0dfd4515470309f171ce15c00d761536"
BASE_URL = "https://api.themoviedb.org/3"
GENRES_URL = f"{BASE_URL}/genre/movie/list?api_key={TMDB_API_KEY}&language=en-US"

# Conexión a Neo4j
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
session = driver.session()

# Función para obtener los detalles de una película desde TMDb
def get_genre_names(genre_ids):
    response = requests.get(GENRES_URL).json()
    genres = {genre['id']: genre['name'] for genre in response['genres']}
    return [genres.get(genre_id) for genre_id in genre_ids if genre_id in genres]

# Función para obtener los actores y directores
def get_actors_and_directors(movie_id):
    credits_url = f"{BASE_URL}/movie/{movie_id}/credits?api_key={TMDB_API_KEY}&language=en-US"
    response = requests.get(credits_url).json()
    
    actors = [cast['name'] for cast in response.get('cast', [])]
    directors = [crew['name'] for crew in response.get('crew', []) if crew['job'] == 'Director']
    
    return actors, directors

def search_movie(title):
    search_url = f"{BASE_URL}/search/movie?api_key={TMDB_API_KEY}&query={title}&language=en-US"
    response = requests.get(search_url).json()
    
    if response["results"]:
        movie = response["results"][0]
        genre_names = get_genre_names(movie["genre_ids"])
        actors, directors = get_actors_and_directors(movie["id"])

        return {
            "tmdb_id": movie["id"],
            "title": movie["title"],
            "year": movie["release_date"].split("-")[0] if "release_date" in movie else None,
            "rating": movie.get("vote_average"),
            "overview": movie.get("overview"),
            "poster_path": movie["poster_path"],
            "genres": genre_names,
            "actors": actors,
            "directors": directors
        }
    
    return None


def insert_movie(movie_details):
    with driver.session() as session:
        query = """
        MERGE (m:Movie {tmdb_id: $tmdb_id})
        SET m.title = $title, m.year = $year, m.rating = $rating, m.overview = $overview, m.poster_path = $poster_path
        """
        session.run(query, **movie_details)

        for genre in movie_details["genres"]:
            query = """
            MERGE (g:Genre {name: $genre_name})
            WITH g
            MATCH (m:Movie {tmdb_id: $tmdb_id})
            MERGE (m)-[:ES_DE_GENERO]->(g)
            """
            session.run(query, genre_name=genre, tmdb_id=movie_details['tmdb_id'])

        for actor in movie_details["actors"]:
            query = """
            MERGE (a:Actor {name: $actor_name})
            WITH a
            MATCH (m:Movie {tmdb_id: $tmdb_id})
            MERGE (m)-[:ACTUO_EN]->(a)
            """
            session.run(query, actor_name=actor, tmdb_id=movie_details['tmdb_id'])

        for director in movie_details["directors"]:
            query = """
            MERGE (d:Director {name: $director_name})
            WITH d
            MATCH (m:Movie {tmdb_id: $tmdb_id})
            MERGE (m)-[:DIRIGIO]->(d)
            """
            session.run(query, director_name=director, tmdb_id=movie_details['tmdb_id'])

def limpiar_titulo(titulo):
    return re.sub(r'\s*\(\d{4}\)$', '', titulo)

def process_csv(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row["title"]
            print(f"Procesando: {title}")
            title_clear = limpiar_titulo(title)
            movie_details = search_movie(title_clear)
            if movie_details:
                insert_movie(movie_details)


if __name__ == "__main__":
    process_csv("movies.csv")
    session.close()
