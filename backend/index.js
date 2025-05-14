const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const app = express();
const port = 4000;

app.use(cors({
  origin: 'http://localhost:3000'
}));

app.get('/', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('RETURN "Hola desde Neo4j" AS mensaje');
    res.send(result.records[0].get('mensaje'));
  } finally {
    await session.close();
  }
});

app.get('/get/movies', async (req, res) => {
  console.log("Peticion /get/movies");
  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (m:Movie)
       RETURN m.overview AS overview, m.rating AS rating, m.title AS title, m.year AS year, m.poster_path AS poster_path`
    );
    const movies = result.records.map(r => ({
      title: r.get("title"),
      year: r.get("year"),
      overview: r.get("overview"),
      poster_path: r.get("poster_path")
    }));
    res.status(200).send(movies);
  } catch (err) {
    console.log("Error al obtener las peliculas: ", err);
    res.status(500).send("Error interno al obtener las peliculas.");
  }
});


app.get('/get/movie/recomendation/:name', async (req, res) => {
  const name = req.params.name;
  const exclude = req.query.exclude ? req.query.exclude.split(',') : [];

  try {
    const session = driver.session();
    const result = await session.run(
      `
      MATCH (m:Movie {title: $name})
      OPTIONAL MATCH (m)-[:ES_DE_GENERO]->(g:Genre)<-[:ES_DE_GENERO]-(rec:Movie)
      OPTIONAL MATCH (m)-[:DIRIGIO]->(d:Director)<-[:DIRIGIO]-(rec)
      OPTIONAL MATCH (m)-[:ACTUO_EN]->(a:Actor)<-[:ACTUO_EN]-(rec)
      WHERE rec.title <> $name AND NOT rec.title IN $exclude
      WITH rec, COUNT(DISTINCT g) AS gen, COUNT(DISTINCT d) AS dir, COUNT(DISTINCT a) AS act, rec.rating AS rating
      RETURN rec.title AS title, rec.poster_path AS poster_path, rec.year AS year, rec.overview AS overview, (gen + dir + act) AS score, rating
      ORDER BY score DESC, rating DESC
      LIMIT 3
      `,
      { name, exclude }
    );

    const movies = result.records.map(r => ({
      title: r.get("title"),
      year: r.get("year"),
      overview: r.get("overview"),
      poster_path: r.get("poster_path")
    }));

    res.status(200).send(movies);
  } catch (err) {
    console.error("Error al obtener las recomendaciones: ", err);
    res.status(500).send("Error interno al obtener recomendaciones.");
  }
});


app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
});
