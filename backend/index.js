const express = require('express');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));


const app = express();
const port = 4000;

app.get('/', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('RETURN "Hola desde Neo4j 2" AS mensaje');
    res.send(result.records[0].get('mensaje'));
  } finally {
    await session.close();
  }
});

app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
});
