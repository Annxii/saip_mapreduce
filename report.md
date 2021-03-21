# Mandatory Exercise 6 - MongoDB & MapRedeuce

Each exercise is answered by brief explanation of what led to the code, the code itself and finally the answer.

All individual exercises have been solved using and external script executed using the mongo shell. The following line connecting to the __MovieLens__ database are implicit in all of the answers.
```javascript
db =  new Mongo().getDB('movielens');
```
<p>&nbsp;</p>

## 1. Find the ID of "The Rock"
A simple search for "The Rock" does not yield any result since all movies beginning with "The" start with their first significant word.

Searching just for movies starting "Rock" yields multiple results.

Using both the significant word "Rock" and the year (1996) using a _regular expression_ yields the single movie title we are looking for.
### Code
```javascript
db.movies.find({
    "title": { $regex: /^Rock.+1996/}
})
.forEach(e =>{ print(e._id)} );
```
### Answer
> ID = 733
<p>&nbsp;</p>

## 2. Number of 5-star ratings for "The Rock"?
The _ID_ for the movie and the constant rating of _5_ given from the exercise text are used to query the _ratings_-collection. The result of this query is counted for the total number of 5-star ratings.

### Code
```javascript
let count = db.ratings.find(
    {
        "movie_id": 733,
        "rating": 5
    }).count();

print(count);
```

### Answer
> Count = 299
<p>&nbsp;</p>

## 3. Calculate the distribution of ratings for "The Rock"
This is solved by a _mapReduce_-function. The _ratings_-collection is queried by the movie ID to initially reduce the dataset. Each record is an indication of a rating given. As we need to calculate the number of each rating we use the _rating_ as key for each record with a simple value of _1_ for the indication that this rating appeared once in this record. The _reduce_ is a simple matter of summing up the number of appearances.

### Code
```javascript
let movie_id = 733;
let outCollection = "ratingDistribution_" + movie_id;

function mapNumOfRating(){
    emit(this.rating, 1);
} 

function reduceNumOfRatings(key, values) {
    let total = 0;
    values.forEach(n => total += n);

    return total;
}

db.ratings.mapReduce(
    mapNumOfRating,
    reduceNumOfRatings,
    {
        out: outCollection,
        query: { "movie_id": movie_id } 
    });

db[outCollection].find().sort({ _id: 1}).forEach(e => printjson(e));
```

### Answer
> __id_ is the rating and _value_ is the number of times this rating appeared for the particular movie.
```json
{ "_id" : 1, "value" : 30 }
{ "_id" : 2, "value" : 97 }
{ "_id" : 3, "value" : 386 }
{ "_id" : 4, "value" : 528 }
{ "_id" : 5, "value" : 299 }
```
<p>&nbsp;</p>

## 4./6. Calcualte the average rating for movies (including "The Rock")
This is solved by a _mapReduce_-function. The reduction accumulates the rating value and the number of rating for final calculation of the average. The mapping prepares for this by make the rating itself the accumulated value from one occurrence.

The accumulated rating value and number of ratings are kept in each reduction result to allow for multiple iterations of reduction.

### Finding the average rating of a single movie (4.)
Since the _mapReduce_-function is already mapping to the _movie_id_ calculating the rating for a single movie is a matter of querying the _ratings_-collection by movie ID to initially reduce the dataset. The alternative _mapReduce_-function will then look like this:
```javascript
db.ratings.mapReduce(
    mapAvgRating,
    reduceAvgRating,
    {
        out: outCollection,
        query: { "movie_id": 733 } 
    });
```

### Code
```javascript
let outCollection = "avgRatings";

function mapAvgRating(){
    let value = {
        numOfRatings: 1,
        accumulatedRating: this.rating
    };
    emit(this.movie_id, value);
} 

function reduceAvgRating(key, values){
    let numOfRatings = 0;
    let accumulatedRating = 0;
    values.forEach(e => {
        numOfRatings += e.numOfRatings;
        accumulatedRating += e.accumulatedRating;
    })

    return {
        numOfRatings: numOfRatings,
        accumulatedRating: accumulatedRating,
        average: accumulatedRating / numOfRatings
    };
}

db.ratings.mapReduce(
    mapAvgRating,
    reduceAvgRating,
    {
        out: outCollection 
    });

db[outCollection].find({ "_id": 733 }).forEach(e => printjson(e));
```

### Answer
> The final result is located at _$.value.average_ (~3.723)
```json
{
	"_id" : 733,
	"value" : {
		"numOfRatings" : 1340,
		"accumulatedRating" : 4989,
		"average" : 3.723134328358209
	}
}
```
<p>&nbsp;</p>

## 05. Calculate distribution of all movies
The mapping partitions the ratings by the ID of the movie they belong to and produces an array of length 5 representing the possible ratings (1 to 5) in order. This array have 0 ("zero") in all positions except for the rating given. The reduction sums up the number of occurrences for each possible rating.

_The output samples the full result by displying the result from 10 movies, including the same as in exercise 3 to verify that the result of this movie matches that of exercise 3._

### Code
```javascript
let outCollection = "saip_rating_dist";

function mapRatingDistribution() {
    let distribution = new Array(5).fill(0);
    distribution[this.rating - 1] = 1;
    emit(this.movie_id, distribution);
} 

function reduceRatingDistribution(key, values) {
    let result = new Array(5).fill(0);
    for (let i = 0; i < values.length; i++) {
        for (let x = 0; x < result.length; x++) {
            result[x] += values[i][x];
        }
    }

    return result;
}

db.ratings.mapReduce(
    mapRatingDistribution,
    reduceRatingDistribution,
    { out: outCollection }
);

db[outCollection]
    .find({ _id: { $gte: 733 } })
    .sort({_id: 1})
    .limit(10)
    .forEach(e => printjson(e));
```

### Sample test
```json
{ "_id" : 733, "value" : [ 30, 97, 386, 528, 299 ] }
{ "_id" : 734, "value" : [ 0, 1, 1, 1, 0 ] }
{ "_id" : 735, "value" : [ 13, 12, 24, 30, 22 ] }
{ "_id" : 736, "value" : [ 94, 195, 361, 344, 116 ] }
{ "_id" : 737, "value" : [ 125, 82, 59, 27, 7 ] }
{ "_id" : 741, "value" : [ 5, 14, 54, 116, 125 ] }
{ "_id" : 742, "value" : [ 37, 49, 54, 27, 7 ] }
{ "_id" : 743, "value" : [ 27, 21, 37, 15, 7 ] }
{ "_id" : 744, "value" : [ 1, 1, 1, 0, 0 ] }
{ "_id" : 745, "value" : [ 3, 2, 40, 217, 395 ] }
```
<p>&nbsp;</p>

## 6. Calcualte the average rating for all movies
> See 4.
<p>&nbsp;</p>

## 7. Lowest rated movie
We have previously caluclated the average rating for all movies in _ Exercise 4./6._ - we use this dataset to find the lowest rated movie. The mapping merely makes a bit of formatting to the existing records. Since we are only looking for a single result we map to the constant key of _1_, bringing all the average ratings into the same partition.

The reduction filters out any movies with less than 100 ratings and find the movie with the lowest rating within the chunk.

_The result only contain the id and average rating of the movie. In order to get something a little more human readable we find the title from the "movies"-collection_.

### Code
```javascript
let outCollection = "lowestRated";

function mapLowestRated(){
    emit(1, { movie_id: this._id, rating: this.value.average, numOfRatings: this.value.numOfRatings });
}

function reduceLowestRated(key, values){
    let lowest = { rating: 1000 };
    values.filter(e => e.numOfRatings >= 100).forEach(e => {
        if(e.rating < lowest.rating){
            lowest = e;
        } 
    });

    return lowest;
}

db.avgRatings.mapReduce(
    mapLowestRated,
    reduceLowestRated,
    { out: outCollection } 
);

db[outCollection].find().forEach(e => {
    db.movies.find({ _id: e.value.movie_id }).forEach(m => {
        printjson({ movie_id: e.value.movie_id, title: m.title, rating: e.value.rating });
    });

});
```

### Answer
```json
{
	"movie_id" : 810,
	"title" : "Kazaam (1996)",
	"rating" : 1.4666666666666666
}
```
<p>&nbsp;</p>

## 8./9. Movies by genre
The mapping phase pivots the movie by its genres, making a record for each genre with a list of movies - starting with only one.

The reduction phase discards all records which are not in the requested genre and then merges the result from each of the remaining records.

Since we are only looking for a single result we map to the constant key of _1_, bringing all the average ratings into the same partition. 

### Parameterizing the script
_Exercise 8 & 9_ are more or less identical - _8_ is counting while _9_ is listing the items. Instead of creating two nearly identical script we opted for parameterization of the script. The script require the parameter 'genre' to be defined to execute. This parameter is then used to create a dynamic collection name for the output as well as filtering the movies.

We configure the _mapReduce_ execution with a _scope_ that defines global variables available within the execution scope of the process. In our case, we expose the 'genre'-variable.

To define 'genre' when prepend the execution of the actual script with a small adhoc script only defining 'genre'.

```shell
mongo --quiet --eval "let genre = 'Animation';" 08-09-genre-movies.js
```

### Code
```javascript
if(!genre){
    throw '\'genre\' not specified';
} 

let outCollection = `saip_${genre.toLowerCase()}_movies`;

function mapGenreMovies(){
    let genres = Array.isArray(this.genres) ? this.genres : [this.genres];
    genres.forEach(g => {
        emit(1, {
            genre: g,
            count: 1,
            movies: [
               { id: this._id, title: this.title }  
            ] 
        });
    })
} 

function reduceGenreMovies(key, values){
    let result = { genre: genre, count: 0, movies: [] };
    values.filter(m => m.genre === genre).forEach(m => {
        result.count += m.count;
        Array.prototype.push.apply(result.movies, m.movies);
    });

    return result;
} 

db.movies.mapReduce(
    mapGenreMovies,
    reduceGenreMovies,
    {
        out: outCollection,
        scope: {
            genre: genre
        } 
    }
);

db[outCollection].find().forEach(e => printjson(e));
```

### Answer (8.)
> Number of 'animation' movies = 105
```json
{
	"_id" : 1,
	"value" : {
		"genre" : "Animation",
		"count" : 105,
		"movies" : [
			{
				"id" : 3945,
				"title" : "Digimon: The Movie (2000)"
			},
			{
				"id" : 3799,
				"title" : "Pokemon the Movie 2000 (2000)"
			},

...

			{
				"id" : 1,
				"title" : "Toy Story (1995)"
			}
		]
	}
}

```

### Answer (9.)
> Collection 'saip_drama_movies' containing 'Drama' movies
```json
{
	"_id" : 1,
	"value" : {
		"genre" : "Drama",
		"count" : 1603,
		"movies" : [
			{
				"id" : 3952,
				"title" : "Contender, The (2000)"
			},
			{
				"id" : 3951,
				"title" : "Two Family House (2000)"
			},

...

			{
				"id" : 4,
				"title" : "Waiting to Exhale (1995)"
			}
		]
	}
}
```
<p>&nbsp;</p>

## 10. Number of 'writer'
Finding 'writer' is near identical to finding the number of 5-star ratings in _Exercise 2_. _users_-collection is filtered by occupation and the result is counted.

## Code
```javascript
let count = db.users
    .find({ "occupation": 20 })
    .count();

print(count);
```

## Answer
> Number of writers = 281

<p>&nbsp;</p>

## 11./12. Rating distribution for specific occupation
Calulating the distribution of ratings from a specific occupations uses the same map-reduce-functions as _Exercise 5_. The difference resides in the filtering. Before executing the map-reduce for the actual question another map-reduce is executed generating an array of IDs on all the users of the specific occupation. This array is then used as a filter in the second map-reduce-function finding the distribution for each movie but on a reduced set of ratings.

_Similar to_ Exercise 8 and 9 _this script has been parameterized to be able to produce results specialized to different occuptions. The question of the distribution for a specific movie by users with a specific occupation can subsequently by answered by querying the result of map-reduce-function defined below. Alternatively, this ID of the movie could be used as an additional query parameter when executing the map-reduce-function._

## Code
```javascript
if(!occupation) {
    throw '\'occupation\' not specified';
}

let users = db.users.mapReduce(
    function() { emit(1, [this._id]); },
    function(key, values) { return Array.prototype.concat.apply([], values); },
    {
        out: { inline: 1},
        query: { "occupation": occupation }
    }
).results[0].value;


let outCollection = `saip_occupation_${occupation}_rating_distribution`;

function mapWriterRatingDistribution() {
    let distribution = new Array(5).fill(0);
    distribution[this.rating - 1] = 1;
    emit(this.movie_id, distribution);
} 

function reduceWriterRatingDistribution(key, values) {
    let result = new Array(5).fill(0);
    for (let i = 0; i < values.length; i++) {
        for (let x = 0; x < result.length; x++) {
            result[x] += values[i][x];
        }
    }

    return result;
}

db.ratings.mapReduce(
    mapWriterRatingDistribution,
    reduceWriterRatingDistribution,
    {
        out: outCollection,
        query: { "user_id": { $in: users }}
    }
);

db[outCollection]
    .find({ _id: { $gte: 733 }})
    .sort({ _id: 1})
    .limit(10)
    .forEach(e => printjson(e));
```

## Answer (11.)
```shell
mongo --quiet --eval "let occupation = 20;" 11-rating-distribution-for-occupation.js
```
```json
{ "_id" : 733, "value" : [ 4, 7, 15, 18, 9 ] }
{ "_id" : 735, "value" : [ 1, 1, 0, 2, 4 ] }
{ "_id" : 736, "value" : [ 7, 12, 12, 13, 1 ] }
{ "_id" : 737, "value" : [ 11, 5, 0, 0, 0 ] }
{ "_id" : 741, "value" : [ 0, 0, 2, 10, 9 ] }
{ "_id" : 742, "value" : [ 5, 1, 1, 0, 0 ] }
{ "_id" : 743, "value" : [ 1, 1, 3, 0, 0 ] }
{ "_id" : 744, "value" : [ 0, 0, 1, 0, 0 ] }
{ "_id" : 745, "value" : [ 1, 0, 6, 20, 21 ] }
{ "_id" : 746, "value" : [ 0, 0, 1, 3, 2 ] }
```

## Answer (12.)
```shell
mongo --quiet --eval "let occupation = 12;" 11-rating-distribution-for-occupation.js
```
```javascript
{ "_id" : 733, "value" : [ 2, 8, 26, 30, 15 ] }
{ "_id" : 735, "value" : [ 1, 0, 0, 1, 2 ] }
{ "_id" : 736, "value" : [ 3, 11, 24, 20, 8 ] }
{ "_id" : 737, "value" : [ 7, 7, 7, 3, 0 ] }
{ "_id" : 741, "value" : [ 1, 0, 6, 12, 12 ] }
{ "_id" : 742, "value" : [ 0, 2, 3, 1, 0 ] }
{ "_id" : 743, "value" : [ 1, 1, 1, 0, 1 ] }
{ "_id" : 745, "value" : [ 0, 1, 2, 20, 41 ] }
{ "_id" : 747, "value" : [ 1, 0, 0, 0, 0 ] }
{ "_id" : 748, "value" : [ 2, 3, 14, 12, 3 ] }
```


## 14. Denormalized schema for MovieLens database
The denormalized schema is centered around "movies". "Ratings" have been added as an array of complex objects in which both the rating-information and the user who gave the rating reside.

The schema is defined in accordance with https://json-schema.org/

### Example:
```json
{
    "_id": 733,
    "title": "The Rock",
    "genres": [
        "action",
        "drama"
    ],
    "ratings": [
        {
            "rating": 5,
            "timestamp": "978300760",
            "user": {
                "_id": 123,
                "gender": "M",
                "age": 1,
                "occupation": 20,
                "zip_code": "48067"
            }
        }
    ]
}
```

### Schema:
```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",

    "definitions": {
        "rating": {
            "type": "object",
            "properties": {
                "rating": { "type": "integer" },
                "timestamp": { "type": "string" },
                "user": { "$ref": "#/definitions/user" }
            }
        },
        "user": {
            "type": "object",
            "properties": {
                "_id": { "type": "integer" },
                "gender": { "type": "string" },
                "age": { "type": "integer" },
                "occupation": { "type": "integer" },
                "zip_code": { "type": "string" }
            }
        }
    },

    "type": "object",
    "properties": {
        "_id": { "type": "integer" },
        "title": { "type": "string" },
        "genres": {
            "type": "array",
            "items": { "type": "string" }
        },
        "ratings": {
            "type": "array",
            "items": { "$ref": "#/definitions/rating" }
        }
    }
}
```