db =  new Mongo().getDB('movielens');

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