const app = {}

app.movieApi = "https://api.themoviedb.org/3/";
app.movieApiKey = "993e3f1a5ab9378c732a3cf32f8a2988";

/*
Movie Calls
Get Genre List - /genre/movie/list
Get Movies List - /discover/movie
Get Specific Movie - /movie/{movie_id}

TV Calls
Get Genre List - /genre/tv/list
Get TV List - /discover/tv
Get Specific TV Show - /tv/{tv_id}
Search for a TV Show - /search/tv/?query={search string}

*/

/**
 * Make request to moviedb api
 */
app.getMovieData = (type) => {
  const returnValue = $.ajax({
			url: `${app.movieApi}discover/${type}`,
			method: 'GET',
			dataType: 'JSON',
      data: {
        api_key: app.movieApiKey,
        page: 2
			}
		})

		returnValue.then((response) => {
			console.log(response);
		}).fail((error) => {
			console.log(error);
		});

};



/**
 * Display results of moviedb api request
 */
// app.displayMovieData = (type) => {
	
// };



// &with_runtime.gte=5&with_runtime.lte=10

/**
 * Add event listeners
 */
app.setEventListeners = () => {

  $('.searchForm').on('submit', function(e) {
		e.preventDefault();
		const $timeInput = $('#travelTime');
		const $mediaType = $('input[name="media"]:checked');

		console.log('form submitted');
		
		const time = $timeInput.val();
		const type = $mediaType.val();

		console.log({time, type});
		app.getMovieData(type);
  })
      // do something
  }


/** Initialize App */
app.init = function() {
  app.setEventListeners(); 
}

// DOCUMENT READY
$(() => {
  app.init();
})