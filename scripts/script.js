/** @namespace app */
const app = {}

// API endpoints
app.movieApi = "https://api.themoviedb.org/3/";
app.movieImageUrl = "https://image.tmdb.org/t/p/w500";
app.infoUrl = "https://www.themoviedb.org/";

// API key
app.movieApiKey = "993e3f1a5ab9378c732a3cf32f8a2988";

/** @type {object} genre lists taken from API */
app.genres = {
	movie: [],
	tv: []
}

/** @type {array} list of media to display */
app.mediaList = [];

/** @type {number} total runtime of selected media */
app.mediaListRuntime = 0;

/** @type {number} travel time input by user */
app.userTravelTime = 0;


/**
 * Template moviedb api call
 * @param {string} path - path to append to endpoint
 * @param {object} extraData - additional parameters to send with API request
 * @returns {object} jqXHR Object from API response
 */
app.getMediaData = function(path, extraData = {}) {
	// default data parameters for the ajax call
	// allow for additional parameters through extraData parameter
	const data = {
		api_key: app.movieApiKey,
		language: "en-US",
		page: 1,
		...extraData
	} 
	// append value of 'path' to the url and return the promise of the ajax call
	return $.ajax({
		url: app.movieApi + path,
		method: 'GET',
		dataType: 'JSON',
		data: data
	})
}

/**
 * Make request to moviedb api
 * @param {string} type - the type of media to request
 * @param {object} searchFilter - additional parameters to send with API request
 */
app.getMovieData = function(type, searchFilter = {}) {
	const path = 'discover/' + type;

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
							const mediaRuntime = type === "movie" ? runtime : episode_run_time[0]; 
							// if user inputs travel time, return results that are less than or equal to the submitted trabel time
							if (searchFilter["with_runtime.lte"]) {
								const travelTime = searchFilter["with_runtime.lte"];
								return travelTime >= mediaRuntime  && mediaRuntime > 0
							}

							return mediaRuntime > 0
						});
					
						app.displayMovieData(mediaDetails);
				}); // end of .then
		}); // end of app.getMediaData
}; // end of app.getMovieData


/**
 * Display results of moviedb api request
 * @param {object} results - the results of the API response
 */
app.displayMovieData = (results) => {
	// get the div containing the media results
	const $mediaResults = $('.mediaResults__content');
	// empty the container
	$mediaResults.empty();

	// loop through the results provided by the api and append them to the media results container
	results.forEach(({id, title, name, backdrop_path, poster_path, runtime, episode_run_time}) => {
		// store media type in variable dependant on runtime property... movie (title) or tv show (name)
		const mediaType = runtime ? "movie" : "tv";
		// store title in variable dependant on media type ... movie (title) or tv show (name)
		const mediaTitle = title ? title : name;
		// store runtime in variable dependant on media type ... movie (runtime) or tv show (episode_run_time)
		const mediaRuntime = runtime ? runtime: episode_run_time[0];
		// store timeString value of the media runtime
		const timeString = app.getTimeString(mediaRuntime);
		// store image source...backdrop by default, if null grab the poser
		const imageSrc = backdrop_path ? app.movieImageUrl + backdrop_path : app.movieImageUrl + poster_path;

		// append media results html to the container
		$mediaResults.append(`
			<div class="mediaResults__container" data-id="${id}" data-type="${mediaType}" data-runtime="${mediaRuntime}">
				<h3 class="mediaResults__title">${mediaTitle}</h3>
				<div class="imageContainer">
					<img src=${imageSrc} alt="${mediaTitle}">
					<div class="mediaResults__moreInfo">
						<a href="${app.infoUrl}${mediaType}/${id}" target="_blank">More Info<i class="fas fa-external-link-alt"></i></a>
					</div>
				</div>
				<div class="mediaResults__info">
					<p class="mediaResults__runtime">${timeString}</p>
					<button class="button__list button__list--add button__primary">Add to list</button>
				</div>
				
			<div>
		`);

	});
};

/**
 * Set the main search button text
 */
app.setButtonText = () => {
	const $submitButton = $('.search__time button[type="submit"]');
	const type = $('input[name="media"]:checked').val();
	// set to 'find movies' or 'find tv'
	$submitButton.text(`Find ${type}${type === 'movie' ? 's' : ''}`);
};

/**
 * Add event listeners
 */
app.setEventListeners = () => {

	// get media results based off user input
  $('.form__search').on('submit', function(e) {
		e.preventDefault();
		app.getMediaResults();
	});

	// display map on directions submit
	$('.form__directions').on('submit', function(e) {
		e.preventDefault();
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

		// focus on origin input
		$('#origin').focus();
	});

	// close map on button click
	$('.directions').on('click', '.button__map', function() {
		$('.directions').toggleClass('hidden');
	});


	// populate genres based off media type
	$('#movie').on('change', app.populateMediaGenres);
	$('#tv').on('change', app.populateMediaGenres);

	// add media selection to list
	$('.mediaResults').on('click', 'button', app.addMediaListItem);
	
	// remove item from list when button is clicked
	$('.sidebar__content').on('click', '.button__list--remove', app.removeMediaListItem);
	$('.mediaResults').on('click', '.button__list--added', app.removeMediaListItem);

	// change search button text on media type change
	$('input[name="media"]').on('change', app.setButtonText);
};


/**
 * Display the media list in the sidebar
 */
app.displayMediaList = () => {
	const $sidebarText = $('.sidebar__text');
	const $sidebarContent = $('.sidebar__content');

	let mediaListText;

	// if there is media in the list, display the total runtime
	if (app.mediaList.length) {
		mediaListText = `<p class="sidebar__time">Total Time: <span class="totalTime"></span></p>`;
	}
	// else display instructions for the user to add to the list
	else {
		mediaListText = `<p class="sidebar__text">Click the Add To List button!</p>`;
	}

	// empty sidebar text content and apply dynamic text
	$sidebarText.empty().append(mediaListText);
	$sidebarContent.empty();

	// loop through items in the media list and append to the list section
	app.mediaList.forEach(({id, type, title, imgSrc, runtime, timeString}) => {
		// sidebar list content
		$sidebarContent.append(`
		<div class="showList__media" data-id="${id}" data-runtime="${runtime}">
			<div class="imageContainer">
				<img src="${imgSrc}" alt="${title}">
				<div class="mediaResults__moreInfo">
		 			<a href="${app.infoUrl}${type}/${id}" target="_blank" aria-label="Show Info"><span> <i class="fas fa-external-link-alt"></i></span></a>
		 		</div>
				<button data-title="${title}" data-runtime="${runtime}" class="button__list button__list--remove button__primary"><i class="fas fa-times"></i></button>
			</div>
			<div class="showList__info">
				<h3 class="showList__title">${title}</h3>
				<p class="showList__runtime">${timeString}</p>
			</div>
		</div>
		`);
	});
	
	// update the list text with the correct media runtime calculation
	app.displayMediaTime();
}

/**
 * Gather user input and make api call to get media results
 */
app.getMediaResults = () => {
	const $hourInput = $('#travelHours');
	const $minuteInput = $('#travelMinutes');

	const $mediaType = $('input[name="media"]:checked');
	const $directions = $('.directions');

	const genre = $('#genres').val();
	
	// set value to 0 if hours or minutes does not have a value
	const hours = parseInt($hourInput.val()) || 0;
	const minutes = parseInt($minuteInput.val()) || 0;

	// calculate time in total minutes
	const time = (hours * 60) + minutes;
	app.userTravelTime = time;

	// display media in list if 
	if (app.mediaList.length) {
		app.displayMediaTime();
	}

	// store type in variable (movie or tv)
	const type = $mediaType.val();

	// search filters for the media query
	const searchFilter = {};
	if (time) { 
		searchFilter["with_runtime.lte"] = time; 
	}

	if (genre) {
		searchFilter["with_genres"] = genre;
	}
	
	// call api method with the media type and search filters
	app.getMovieData(type, searchFilter);

	// hide the google maps directions
	$directions.addClass('hidden');

	// if time is entered, remove attention from instruction
	if (time) {
		$('.instruction').removeClass('attention');
	}	
}

/**
 * Add media item to show list
 */
app.addMediaListItem = function() {
	// store values of interest to be stored in an object later
	const $mediaContainer = $(this).parent().parent();
	const id = $mediaContainer.data('id');
	const type = $mediaContainer.data('type');
	const title = $mediaContainer.find('.mediaResults__title').text();
	const imgSrc = $mediaContainer.find('img').attr('src');
	const runtime = $mediaContainer.data('runtime');
	const timeString = $mediaContainer.find('.mediaResults__runtime').text();

	
	// check if the media has already been added to the list
	if (!app.mediaList.find(media => media.id === id)) {
		// store media values of interest into object
		const selectedMedia = {
			id,
			type,
			title,
			imgSrc,
			runtime,
			timeString
		}
			
		// push the selected media object into the mediaList array
		app.mediaList.push(selectedMedia);
		// add the runtime to the media list total runtime
		app.mediaListRuntime += runtime;
		// display the updated media list
		app.displayMediaList();
		// update the button of the media results container to display Remove
		$(`[data-id="${id}"].mediaResults__container button`)
			.text('Remove')
			// add class of '--added' to visibly indicate the change of state of the button
			.toggleClass('button__list--add button__list--added');
	}
}

/**
 * Remove media item from show list
 */
app.removeMediaListItem = function() {
	// store id and runtime of the item to be removed
	const $mediaContainer = $(this).parent().parent();
	const id = $mediaContainer.data('id');

	// update the media list by filtering out the removed item's id
	app.mediaList = app.mediaList.filter(media => media.id !== id);

	// go through the mediaList and store the sum of the runtimes
	app.mediaListRuntime = app.mediaList.reduce((accum, {runtime}) => {
		return accum += runtime
	}, 0);
	
	// display the updated media list
	app.displayMediaList();
	// update the button in the media results container text back to 'add to list'
	$(`[data-id="${id}"].mediaResults__container button`)
			.text('Add to list')
			// toggle class to visibly indicate change of state of button
			.toggleClass('button__list--add button__list--added');
}


/**
 * Display time available and remaining in list in 1h 00m format
 */
app.displayMediaTime = () => {
	// store 'time string' value of the media list runtime
	const listTimeString = app.getTimeString(app.mediaListRuntime);

	const timeRemaining = app.userTravelTime - app.mediaListRuntime;

	const travelTime = app.getTimeString(app.userTravelTime);

	$('.totalTime').html(`
		<p class="sidebar__time">
			<span class="timeRemaining">${listTimeString}</span> / ${travelTime}
		</p>
	`);

	// if user has not entered time and there are shows in list, add attention to instruction
	if (!app.userTravelTime && timeRemaining < 0) {
		$('.instruction').addClass('attention');
	};

	// if time remaining is less than 0 the bring attention to the time remaining
	if (timeRemaining < 0) {
		$('.sidebar__time').find('.timeRemaining').addClass('attention');
	}
}

/**
 * Get genre list from API
 */
app.getMediaGenres = async function() {
  // Get movie genres and add to genre list
  await app.getMediaData(`genre/movie/list`).then(({ genres }) => {
    genres.forEach((genre) => {
      app.genres.movie.push(genre);
    });
  });

  // Get TV genres and add to genre list
  await app.getMediaData(`genre/tv/list`).then(({ genres }) => {
    genres.forEach((genre) => {
      app.genres.tv.push(genre);
    });
  });

	// populate dropdown with genres from API
  app.populateMediaGenres();
}

/**
 * Populate genre dropdown menu	with genres associated with selected media type
 */
app.populateMediaGenres = () => {
	const mediaType = $('input[name="media"]:checked').val();
	const $genres = $('#genres');
	
	// replace content of genre dropdown with 'select' and 'any' options
	$genres.empty().append(`
		<option value="" selected disabled hidden>Select Genre</option>
		<option value="" >Any Genre</option>
	`);
	
	// append selected media genres to dropdown
	app.genres[mediaType].forEach(({id, name}) => {
		$genres.append(`<option value="${id}">${name}</option>`);
	});
};

/**
 * Convert time in minutes to formatted string
 * @param {number} time - the time in minutes to convert
 * @returns {string} time string in format 0h00m
 */
app.getTimeString = (time) => {
	const hours = Math.floor(time / 60);
	const minutes = time % 60;
	const minutesPadded = minutes.toString().padStart(2, '0');

	return hours ? `${hours}h ${minutesPadded}m` : `${minutesPadded}m`;
}


/**
 * Initialize App 
 * */
app.init = function() {
	app.setEventListeners();
	app.getMediaGenres();
	app.setButtonText();
}

/**
 * Document Ready
 */
$(() => {
  app.init();
})