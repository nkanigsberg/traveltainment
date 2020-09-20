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
app.mediaListRuntime = 0;


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


// https://api.themoviedb.org/3/movie/550/images?api_key=993e3f1a5ab9378c732a3cf32f8a2988&language=en-US&include_image_language=en




/**
 * Display results of moviedb api request
 * @param {object} param0 - 
 */
app.displayMovieData = (results) => {
	const $mediaResults = $('.mediaResults__content');
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
			<div class="mediaResults__container" data-id="${id}" data-type="${mediaType}" data-runtime="${mediaRuntime}">
				<h3 class="mediaResults__title">${mediaTitle}</h3>
				<div class="imageContainer">
					<img src=${imageSrc} alt="${mediaTitle}">
					<div class="mediaResults__moreInfo">
						<a href="${app.infoUrl}${mediaType}/${id}" target="_blank">More Info</a>
					</div>
				</div>
				<div class="mediaResults__info">
					<p class="mediaResults__runtime">${timeString}</p>
					<button class="mediaResults__button button__list button__list--add button__primary"">Add to list</button>
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
 * Set the main search button text
 */
app.setButtonText = () => {
	const $submitButton = $('.search__time button[type="submit"]');
	const type = $('input[name="media"]:checked').val();

	console.log($submitButton);
	$submitButton.text(`Find ${type}${type === 'movie' ? 's' : ''}`);
};


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
		const $directions = $('.directions');

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

		$directions.addClass('hidden');

	});
	

	// $('iframe').attr('src', `https://www.google.com/maps/embed/v1/directions?origin=${origin}&destination=${destination}&key=AIzaSyCPyZS2Eotm8pA650bXUbFEvwil8WvTpbE`);


	// display map on directions submit
	$('.form__directions').on('submit', function(e) {
		e.preventDefault();
		const $directions = $('.directions');
		const $map = $('.map');
		const origin = $('#origin').val();
		const destination = $('#destination').val();
		const mode = $('#travelMode option:selected').val();

		$map.empty().removeClass('hidden').append(`
		<iframe width="600" height="450" frameborder="0" style="border:0"
			src="https://www.google.com/maps/embed/v1/directions
				?origin=${origin}
				&destination=${destination}
				&mode=${mode}
				&key=AIzaSyCPyZS2Eotm8pA650bXUbFEvwil8WvTpbE"
			allowfullscreen></iframe>
		`);
	});


	// open map interface when commute time button clicked
	$('.button__commute').on('click', function(e) {
		e.preventDefault();

		const $directions = $('.directions');

		$directions.toggleClass('hidden');

		$directions.find('.button__map').remove();

		$directions.append(`
			<button class="button__map">Close <i class="fas fa-times" aria-label="Close Map"></i></button>
		`);
	});

	// close map on button click
	$('.directions').on('click', '.button__map', function() {
		$('.directions').toggleClass('hidden');
	});


	// populate genres based off media type
	$('#movie').on('change', app.populateMediaGenres);
	$('#tv').on('change', app.populateMediaGenres);

	// add media selection to list
	$('.mediaResults').on('click', 'button', function() {
		// const title = $(this).parent().parent()
		const $mediaContainer = $(this).parent().parent();
		const id = $mediaContainer.data('id');
		const type = $mediaContainer.data('type');
		const title = $mediaContainer.find('.mediaResults__title').text();
		const imgSrc = $mediaContainer.find('img').attr('src');
		const runtime = $mediaContainer.data('runtime');
		const timeString = $mediaContainer.find('.mediaResults__runtime').text();

		
		// check if the media has already been added to the list
		if (!app.mediaList.find(media => media.id === id)) {
			// if not found add the media to the mediaList
				const selectedMedia = {
					id,
					type,
					title,
					imgSrc,
					runtime,
					timeString
				}

			app.mediaList.push(selectedMedia);
			app.mediaListRuntime += runtime;
			app.displayMediaList();
		}
	})

	// remove item from list when button is clicked
	$('.sidebar__content').on('click', '.button__list--remove', function() {
		const $mediaContainer = $(this).parent().parent();
		const id = $mediaContainer.data('id');
		const runtime = $mediaContainer.data('runtime');

		app.mediaList = app.mediaList.filter(media => media.id !== id);
		app.mediaListRuntime -= runtime;

		app.displayMediaList();
	});


	// change search button text on media type change
	$('input[name="media"]').on('change', app.setButtonText);
};


app.displayMediaList = () => {
	const $sidebarContent = $('.sidebar__content');

	$sidebarContent.empty();

	app.mediaList.forEach(({id, type, title, imgSrc, runtime, timeString}) => {
		// <div class="mediaResults__moreInfo">
		// 	<a href="${app.infoUrl}${type}/${id}" target="_blank">More Info</a>
		// 	</div>

		$sidebarContent.append(`
			<div class="showList__media" data-id="${id}" data-runtime="${runtime}">
				<div class="imageContainer">
					<img src="${imgSrc}" alt="${title}">
						<button data-title="${title}" data-runtime="${runtime}" class="button__list button__list--remove button__primary"><i class="fas fa-times"></i></button>
				</div>
				<div class="showList__info">
					<h3 class="showList__title">${title}</h3>
					<p class="showList__runtime">${timeString}</p>
				</div>
			</div>
		`);
	});

	const timeString = app.getTimeString(app.mediaListRuntime);
	$('.totalTime').text(timeString);
}


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

/**
 * @param {integer} time
 */
app.getTimeString = (time) => {
	const hours = Math.floor(time / 60);
	const minutes = time % 60;

	return hours ? `${hours}h${minutes}m` : `${minutes}m`;
}

/** Initialize App */
app.init = function() {
	app.setEventListeners();
	app.getMediaGenres();
	app.setButtonText();
}

// DOCUMENT READY
$(() => {
  app.init();
})