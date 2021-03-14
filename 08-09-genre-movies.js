db =  new Mongo().getDB('movielens');

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