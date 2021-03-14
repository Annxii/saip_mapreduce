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

function reduceNumOfRatings(key, values){
    let total = 0;
    for (let i = 0; i < values.length; i++){
        total += values[i];
    }

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
The final result for each movie should be an object with a property for each possible rating with values indicating the number of occurrences of the rating for the movie. The mapping partitions by the ID of the movie and produces an object similar to the final result. This object has and indication of 0 for all possible ratings except for the rating of the record which is 1. The reduction sums up the number of occurrences for each possible rating.

_The output is merely an example of the final result from a single movie - the same as in exercise 3 to verify that the result of this movie matches that of exercise 3._

### Code
```javascript
let outCollection = "ratingDistributions";

function mapRatingDistribution(){
    let ratings = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    ratings[this.rating + ""] = 1; 
    emit(this.movie_id, { ratings: ratings });
}

function reduceRatingDistribution(key, values){
    let result = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }; 
    for (let i = 0; i < values.length; i++){
        for (let p in result){
            result[p] += values[i].ratings[p]; 
        } 
    } 

    return { ratings: result };
} 

db.ratings.mapReduce(
    mapRatingDistribution,
    reduceRatingDistribution,
    { out: outCollection }
);

db[outCollection].find({ _id: 733 }).forEach(e => printjson(e));
```

### Sample test
```json
{
	"_id" : 733,
	"value" : {
		"ratings" : {
			"1" : 30,
			"2" : 97,
			"3" : 386,
			"4" : 528,
			"5" : 299
		}
	}
}
```
<p>&nbsp;</p>

## 6. Calcualte the average rating for all movies
> See 4.
<p>&nbsp;</p>

## 7. Lowest rated movie
We have previously caluclated the average rating for all movies in _ Exercise 4./6._ - we use this dataset to find the lowest rated movie. The dataset contains the number of ratings given. We use this first in the mapping to discard movies with too few ratings received. Since we are only looking for a single result we map to the constant key of _1_, bringing all the average ratings into the same partition. The mapped result is simply an object with movie ID and average rating.

All the reduction does is find the lowest rated object of the collection.

_The result only contain the id and average rating of the movie. In order to get something a little more human readable we find the title from the "movies"-collection_.

### Code
```javascript
let outCollection = "lowestRated";

function mapLowestRated(){
    if (this.value.numOfRatings >= 100){
        emit(1, { movie_id: this._id, rating: this.value.average });
    } 
}

function reduceLowestRated(key, values){
    let lowest = values[0];
    for (let i = 1; i < values.length; i++){
        if(values[i].rating < lowest.rating){
            lowest = values[i];
        } 
    }

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
