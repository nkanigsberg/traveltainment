const app = {}

app.movieApi = "https://api.themoviedb.org/3/";
app.movieApiKey = "993e3f1a5ab9378c732a3cf32f8a2988";
app.movieImageUrl = "https://image.tmdb.org/t/p/w500";
app.infoUrl = "https://www.themoviedb.org/";

app.genres = {
	movie: [],
	tv: []
}

app.mediaList = [];


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
 * Template moviedb api call
 */

app.getMediaData = function(path, extraData = {}) {
	const data = {
		api_key: app.movieApiKey,
		language: "en-US",
		page: 1,
		...extraData
	} 

	// console.log({extraData});
	// console.table({path, data});

	// console.log(app.movieApi + path);
	
	return $.ajax({
		url: app.movieApi + path,
		method: 'GET',
		dataType: 'JSON',
		data: data
	})
}

/**
 * Make request to moviedb api
 */
app.getMovieData = function(type, searchFilter = {}) {
	const path = 'discover/' + type;

	console.table('getmoviedata call', searchFilter);

	// get media results from /discover/[movie | tv]
	app.getMediaData(path, searchFilter)
		// then make api calls for each of the results returned by the initial call
		.then(response => {
			// store array of media results
			const results = response.results;
			
			// create new array of promises making api calls to get the result details (movie/id or tv/id)
			const mediaResultsDetail = results.map((media) => app.getMediaData(`${type}/${media.id}`));
			
			// wait for all the api calls (promises) to be completed
			$.when(...mediaResultsDetail)
				.then((...results) => {
					const mediaDetails = results
						// return array with the media details
						.map(media => media[0])
						// return array with results that have a runtime greater than 0
						.filter(({runtime, episode_run_time}) => {
							console.log(runtime, episode_run_time);
							const mediaRuntime = type === "movie" ? runtime : episode_run_time[0]; 
							// if user inputs travel time, return results that are less than or equal to the submitted trabel time
							if (searchFilter["with_runtime.lte"]) {
								const travelTime = searchFilter["with_runtime.lte"];
								return travelTime >= mediaRuntime  && mediaRuntime > 0
							}

							console.log('mediaruntime', mediaRuntime)
							return mediaRuntime > 0
						});
					
						app.displayMovieData(mediaDetails);
				}); // end of .then
		}); // end of app.getMediaData
}; // end of app.getMovieData


/**
 * 
 */
app.getMediaDetails = async function(response) {
	// console.log(response);
	
	response.then((result) => {

		// app.displayMovieData(result);
	}).fail((error) => {
		console.log(error);
	});




};

// https://api.themoviedb.org/3/movie/550/images?api_key=993e3f1a5ab9378c732a3cf32f8a2988&language=en-US&include_image_language=en




/**
 * Display results of moviedb api request
 * @param {object} param0 - 
 */
app.displayMovieData = (results) => {
	const $mediaResults = $('.mediaResults');
	$mediaResults.empty();

	console.log(results);

	const newArray = results.slice(0, 10);

	newArray.forEach(({id, title, name, backdrop_path, poster_path, runtime, episode_run_time}) => {
		const mediaTitle = title ? title : name;
		const mediaRuntime = runtime ? runtime: episode_run_time[0];
		const mediaType = runtime ? "movie" : "tv";

		const hours = Math.floor(mediaRuntime / 60);
		const minutes = mediaRuntime % 60;

		const timeString = hours ? `${hours}h${minutes}m` : `${minutes}m`;
		console.log(timeString);

		
		console.log(mediaTitle);
		console.log(backdrop_path);
		console.log(poster_path);

		const imageSrc = backdrop_path ? app.movieImageUrl + backdrop_path : app.movieImageUrl + poster_path;

		$mediaResults.append(`
			<div class="mediaResults__container">
				<h2>${mediaTitle}</h2>
				<div class="imageContainer">
					<img src=${imageSrc} alt="${mediaTitle}">
					<div class="mediaResults__moreInfo">
						<a href="${app.infoUrl}${mediaType}/${id}" target="_blank">More Info</a>
					</div>
				</div>
				<div class="mediaResults__info">
					<p>${timeString}</p>
					<button class="mediaResults__button">Add to list</button>
				</div>
				
			<div>
		`);

	});


	console.log(newArray);
};

// &with_runtime.gte=5&with_runtime.lte=10


/*
0:
adult: false
backdrop_path: "/m7QpUAeI2xTCJyAVl9J9z5dBTSb.jpg"
genre_ids: (3) [28, 27, 878]
id: 722603
original_language: "en"
original_title: "Battlefield 2025"
overview: "Weekend campers, an escaped convict, young lovers and a police officer experience a night of terror when a hostile visitor from another world descends on a small Arizona town."
popularity: 353.143
poster_path: "/w6e0XZreiyW4mGlLRHEG8ipff7b.jpg"
release_date: "2020-07-07"
title: "Battlefield 2025"
video: false
vote_average: 5
vote_count: 16



app.movieImageUrl = "https://image.tmdb.org/t/p/w500/w6e0XZreiyW4mGlLRHEG8ipff7b.jpg" + ;
*/



/**
 * Add event listeners
 */
app.setEventListeners = () => {
	// get media results based off user input
  $('.form__search').on('submit', function(e) {
		e.preventDefault();
		const $hourInput = $('#travelHours');
		const $minuteInput = $('#travelMinutes');

		const $mediaType = $('input[name="media"]:checked');
		const genre = $('#genres').val();

		console.log('form submitted');
		
		const hours = parseInt($hourInput.val()) || 0;
		const minutes = parseInt($minuteInput.val()) || 0;

		const time = (hours * 60) + minutes;

		const type = $mediaType.val();

		// &with_runtime.gte=5&with_runtime.lte=10

		const searchFilter = {};
		if (time) { 
			searchFilter["with_runtime.lte"] = time; 
			console.table(searchFilter);
		}

		if (genre) {
			searchFilter["with_genres"] = genre;
		}

		
		console.log(searchFilter);
		// console.log({time, type});
		app.getMovieData(type, searchFilter);
	})
	

	// $('iframe').attr('src', `https://www.google.com/maps/embed/v1/directions?origin=${origin}&destination=${destination}&key=AIzaSyCPyZS2Eotm8pA650bXUbFEvwil8WvTpbE`);


	// display map on directions submit
	$('.form__directions').on('submit', function(e) {
		e.preventDefault();

		const $map = $('.map');
		const origin = $('#origin').val();
		const destination = $('#destination').val();
		const mode = $('#travelMode option:selected').val();

		$map.empty().removeClass('hidden').append(`
		<button class="button__map">Close Map <i class="fas fa-times" aria-label="Close Map"></i></button>
		<iframe width="600" height="450" frameborder="0" style="border:0"
			src="https://www.google.com/maps/embed/v1/directions
				?origin=${origin}
				&destination=${destination}
				&mode=${mode}
				&key=AIzaSyCPyZS2Eotm8pA650bXUbFEvwil8WvTpbE"
			allowfullscreen></iframe>
		`);


		// close map on button click
		$map.on('click', '.button__map', function() {
			$map.addClass('hidden');
		});
	});

	// populate genres based off media type
	$('#movie').on('change', app.populateMediaGenres);
	$('#tv').on('change', app.populateMediaGenres);

	// add media selection to list
	$('.mediaResults').on('click', 'button', (event) => {
	
	})

};


// https://www.google.com/maps/embed/v1/directions?origin=place_id:ChIJX4Ud3M4rK4gRTORiU8rXyDM&destination=place_id:ChIJJbMiZUwqK4gRb_p9AN3xc2I&key=AIzaSyCPyZS2Eotm8pA650bXUbFEvwil8WvTpbE

/**
 * Get genre list from API
 */
app.getMediaGenres = async function() {
	// const $mediaType = $('input[name="media"]:checked').val();

// https://api.themoviedb.org/3/genre/movie/list?api_key=993e3f1a5ab9378c732a3cf32f8a2988&language=en-US
	await app.getMediaData(`genre/movie/list`)
		.then(({genres}) => {
			genres.forEach((genre) => {
				app.genres.movie.push(genre);
			})
		})

	await app.getMediaData(`genre/tv/list`)
	.then(({genres}) => {
		genres.forEach((genre) => {
			app.genres.tv.push(genre);
		})
	})
		
	app.populateMediaGenres();
}

/**
 * Populate genre dropdown menu	with genres associated with selected media type
 */
app.populateMediaGenres = () => {
	const mediaType = $('input[name="media"]:checked').val();

	
	const $genres = $('#genres');
	$genres.empty().append(`<option value="" selected disabled hidden>Select Genre</option>`);
	app.genres[mediaType].forEach(({id, name}) => {
		// console.log(id, name);
		$genres.append(`<option value="${id}">${name}</option>`);
	})
	
}

/** Initialize App */
app.init = function() {
	app.setEventListeners();
	app.getMediaGenres();
}

// DOCUMENT READY
$(() => {
  app.init();
})