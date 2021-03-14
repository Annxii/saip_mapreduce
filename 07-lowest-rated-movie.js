db =  new Mongo().getDB('movielens');

let outCollection = "saip_lowest_rated";

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

db.saip_avg_ratings.mapReduce(
    mapLowestRated,
    reduceLowestRated,
    { out: outCollection } 
);

db[outCollection].find().forEach(e => {
    db.movies.find({ _id: e.value.movie_id }).forEach(m => {
        printjson({ movie_id: e.value.movie_id, title: m.title, rating: e.value.rating });
    });

});