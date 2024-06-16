const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const dbPath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convertDbObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

// Middleware to parse JSON bodies
app.use(express.json())

// API -1
app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie;`
  try {
    const movie = await db.all(getMoviesQuery)
    response.send(movie.map(eachMovie => ({movieName: eachMovie.movie_name})))
  } catch (error) {
    response.send({error: error.message})
  }
})

// API -2
app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
    INSERT INTO
      movie (director_id, movie_name, lead_actor)
    VALUES
      (
         ${directorId},
        '${movieName}',
        '${leadActor}'
      );`
  try {
    const dbResponse = await db.run(addMovieQuery)
    const bookId = dbResponse.lastID
    response.send('Movie Successfully Added')
  } catch (error) {
    response.send({error: error.message})
  }
})

// API - 3
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT
      *
    FROM
      movie
    WHERE
      movie_id = ${movieId};`
  try {
    const movieArray = await db.get(getMovieQuery)
    response.send(convertDbObjectToResponseObject(movieArray))
  } catch (error) {
    response.send({error: error.message})
  }
})

// API - 4
app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovieQuery = `
    UPDATE
      movie
    SET
      director_id = ${directorId},
      movie_name = '${movieName}',
      lead_actor = '${leadActor}'
    WHERE
      movie_id = ${movieId};`
  try {
    await db.run(updateMovieQuery)
    response.send('Movie Details Updated')
  } catch (error) {
    response.send({error: error.message})
  }
})

// API - 5
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteQuery = `
    DELETE 
    FROM movie 
    WHERE 
      movie_id = ${movieId};`
  try {
    await db.run(deleteQuery)
    response.send('Movie Removed')
  } catch (error) {
    response.send({error: error.message})
  }
})

// API - 6
app.get('/directors/', async (request, response) => {
  const getMovieQuery = `
  SELECT * 
  FROM director;`
  try {
    const director = await db.all(getMovieQuery)
    response.send(director.map(convertDbObject))
  } catch (error) {
    response.send({error: error.message})
  }
})

// API - 7
app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const movieQuery = `
  SELECT movie_name FROM 
  movie
  WHERE director_id = ${directorId};`
  try {
    const movies = await db.all(movieQuery)
    response.send(movies.map(eachMovie => ({movieName: eachMovie.movie_name})))
  } catch (error) {
    response.send({error: error.message})
  }
})

module.exports = app
