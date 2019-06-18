'use strict';

// for MusixMatch API search, so can search by LYRICS or ARTIST or SONG
const musixMatchApiKey = '2795af8d7036855a62070800dc64131d';
const searchURL = 'https://api.musixmatch.com/ws/1.1/track.search';
const trackURL = 'https://api.musixmatch.com/ws/1.1/track.lyrics.get';

// link to MusixMatch artist search results
// const linkURL = 'https://www.musixmatch.com/search';

// link to MusixMatch lyrics search results
const linkURL = 'https://www.musixmatch.com/lyrics';

// for Napster API for song samples
const napsterURL = 'https://api.napster.com/v2.2/search';
const napsterApiKey = 'MDJjYmIwM2UtZmU2ZS00MTFjLTk3MWEtNmU5ZWQwN2FjOWQ3';

const options = {
	mode: 'no-cors',
	headers: new Headers({
		'Access-Control-Allow-Origin': '*'
	})
};

function formatQueryParams(params) {
	const queryItems = Object.keys(params).map(
		key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
	);
	return queryItems.join('&');
}

function formatSearchResults(data) {
	// if there are previous results, remove them
	$('#results-list').empty();
	
	if (data.message.body.track_list === undefined || data.message.body.track_list.length === 0) {
		$('#results-list').append(`
	<li>
	<h3>No Lyrics Found</h3>
	<div class="item">
			<div id="Lyrics" class="lyrics">No lyrics found.</div>
			<div id="Napster" class="music">Nothing found on Napster
for this combination of artist and song title.</div>
	</div>
	</li>`);
	} else {
		// iterate through the result array
		for (let i = 0; i < data.message.body.track_list.length; i++) {
			let item = data.message.body.track_list[i].track;
			let track_id = item.track_id;

			getTrack(item.track_id, item.artist_name, item.track_name);
			
			if(item.track_id !== undefined &&  item.artist_name !== undefined && item.track_name !== undefined ){
				getNapster(item.track_id, item.artist_name, item.track_name);
			}

			$('#results-list').append(`<li><h3>${item.track_name}</h3>
			Artist: ${item.artist_name}
			<br>Album: ${item.album_name}

		<div class="item">
			<div id=${track_id}-Lyrics class="lyrics"></div>
			<div id=${track_id}-Napster class="music"></div>
		</div>
		
	</li>`);
		}
	}
}

function formatTrackResults(data, track_id, artist_name, track_name) {

	// remove all parenthesis = .replace(/[()]/g,"")
	// and replace all non-alphanumeric characters with dashes
	let track = track_name.trim().replace(/[()]/g,"").replace(/\W+/g, "-");
	let artist = artist_name.trim().replace(/[()]/g,"").replace(/\W+/g, "-");
		
	let output = `<a href="${linkURL}/${artist}/${track}" target="_blank">View Lyrics</a> on MusixMatch<br>`;
;

   if(data.message.header.status_code === 200) {
	
		let item = data.message.body.lyrics;
		let lyrics = item.lyrics_body;
		
		output += lyrics ? `<br>Excerpt:<br><em>${lyrics}</em>` : '<br>';
		output += `<br><br>${item.lyrics_copyright}`;

		// output += (item.pixel_tracking_url !== undefined) ? `<img src="https://tracking.musixmatch.com/t1.0/${item.pixel_tracking_url}">` : `<script type="text/javascript" src="https://tracking.musixmatch.com/t1.0/${item.script_tracking_url}">`;

		// output += `<img src="https://tracking.musixmatch.com/t1.0/${item.pixel_tracking_url}" alt="tracking url">`;

		output += `<script type="text/javascript" src="https://tracking.musixmatch.com/t1.0/${
			item.script_tracking_url
		}">`;
	
	}

	$(`#${track_id}-Lyrics`).html(output);
}

function formatNapsterAllResults(data, searchTerm) {
	// clear NapsterAll
	$('#NapsterAll').empty();
	
	let html_output = `<h4>Napster Search Results for<br>"${searchTerm}"</h4><br>`;
	let currentTrack = '';
	let currentAlbum = '';
	let releaseDate = '';
	let currentReleaseDate = '';

	if(data !== undefined){
	
	   let albums = data.search.data.albums;
	   let tracks = data.search.data.tracks;

	   // console.log('*** album = ' + data.search.data.albums[0].name);
	   // console.log('*** track = ' + data.search.data.track[0].name);

	   if(tracks.length !== 0){
		  for (let i = 0; i < tracks.length; i++) {
			  let track = tracks[i];
			  let album = albums[i];


			  if(album !== undefined){
				 let releaseDateTemp = album.originallyReleased.substring(0, 10);

				 let releaseDateParts = releaseDateTemp.split('-');

				 let releaseDateArr = [];
				 releaseDateArr.push(releaseDateParts[1]);
				 releaseDateArr.push(releaseDateParts[2]);
				 releaseDateArr.push(releaseDateParts[0]);

				 releaseDate = releaseDateArr.join('/');
			  }
	   
			  // omit duplicate tracks from list
			  /*
			  console.log('track.albumName = ' + track.albumName );
			  console.log('track name = ' + track.name );
			  console.log('artist name = ' + track.artistName );
			  console.log('currentTrack = ' + currentTrack );
			  console.log('currentAlbum = ' + currentAlbum );
			  console.log('releaseDate = ' + releaseDate );
			  console.log('currentReleaseDate = ' + currentReleaseDate );
			  */
		
			  if (
				  track.name.toLowerCase().includes(currentTrack.toLowerCase()) &&
				  track.albumName !== currentAlbum 
			  ) {
				  html_output += `<div data-track-id="${track.id}" style="background-image:url(https://api.napster.com/imageserver/v2/albums/${track.albumId}/images/300x300.jpg)" alt="${track.name} artwork" class="cover">
						  <div class="content-name">${track.name}
									 <br>by ${track.artistName}
									 <br>${track.albumName}
									 <br>${releaseDate}
								   </div>
						   <audio controls="controls">
									 <source src="${track.previewURL}" type="audio/mpeg">
								   </audio>
						  </div>`;
			  }

			  // save current track for comparison
			  currentTrack = track.name;
			  currentAlbum = track.albumName;
			  currentReleaseDate = releaseDate;
		  }
	   } else {
		   html_output += 'Nothing found.';
	   }
	}

	// console.log('******* #NapsterAll = ' + html_output);
	$('#NapsterAll').append(html_output);
}

function formatNapsterResults(data, track_id, track_name) {

	// console.log('formatNapsterResults data = ' + JSON.stringify(data));
	let html_output = '';
	let currentTrack = '';
	let currentAlbum = '';
	let releaseDate = '';
	let currentReleaseDate = '';

	if(data !== undefined){
		let albums = data.search.data.albums;
		let tracks = data.search.data.tracks;

	// console.log('*** album = ' + data.search.data.albums[0].name);
	// console.log('*** track = ' + data.search.data.track[0].name);
	

	if(tracks.length !== 0){
	   for (let i = 0; i < tracks.length; i++) {
		   let track = tracks[i];
		   let album = albums[i];


		   if(album !== undefined){
			  let releaseDateTemp = album.originallyReleased.substring(0, 10);

			  let releaseDateParts = releaseDateTemp.split('-');

			  let releaseDateArr = [];
			  releaseDateArr.push(releaseDateParts[1]);
			  releaseDateArr.push(releaseDateParts[2]);
			  releaseDateArr.push(releaseDateParts[0]);

			  releaseDate = releaseDateArr.join('/');
		   }
		
		   // omit duplicate tracks from list
		   /* 
		   console.log('track.albumName = ' + track.albumName );
		   console.log('track name = ' + track.name );
		   console.log('artist name = ' + track.artistName );
		   console.log('currentTrack = ' + currentTrack );
		   console.log('currentAlbum = ' + currentAlbum );
		   console.log('releaseDate = ' + releaseDate );
		   console.log('currentReleaseDate = ' + currentReleaseDate );
		   */
		 
		   if (
			   track.name.toLowerCase().includes(currentTrack.toLowerCase()) &&
			   track.albumName !== currentAlbum 
		   ) {
			   html_output += `<div data-track-id="${track.id}" style="background-image:url(https://api.napster.com/imageserver/v2/albums/${track.albumId}/images/300x300.jpg)" alt="${track.name} artwork" class="cover">
					   <div class="content-name">${track.name}
								  <br>by ${track.artistName}
								  <br>${track.albumName}
								  <br>${releaseDate}
								</div>
						<audio controls="controls">
								  <source src="${track.previewURL}" type="audio/mpeg">
								</audio>
					   </div>`;
		   }

		   // save current track for comparison
		   currentTrack = track.name;
		   currentAlbum = track.albumName;
		   currentReleaseDate = releaseDate;
	   }
	} else {
		html_output = '<div data-track-id="${track.id}">Nothing found on Napster<br>for this combination of artist and song title.</div>';
	}
	}

	$(`#${track_id}-Napster`).html(html_output);
}

function doSearch(searchTerm, options, limit=10) {
	$.ajax({
		type: 'GET',
		//tell API what we want and that we want JSON
		data: {
			apikey: musixMatchApiKey,
			q: searchTerm,
			page_size: limit,
			page: 1,
			s_track_rating: 'desc',
			format: 'jsonp'
		},
		url: searchURL,
		// console.log the constructed url
		beforeSend: function(jqXHR, settings) {
			// console.log('searchURL = ' + settings.url);
		},
		//tell jQuery to expect JSONP
		dataType: 'jsonp',
		//work with the response
		success: function(data) {
		
			// remove loader
			$('#results-list').empty();
			
			// b/c jsonp handle different statusCodes this way:
			switch(data.message.header.status_code){
			case 400: 
			$('#js-error-message').html( "The request had bad syntax or was inherently impossible to be satisfied." );
			break;
		  case 401:
		  // getting 401 error instead of 402 when usage limit exceeded
			$('#js-error-message').html( "The usage limit has been reached, either you exceeded per day requests limits or your balance is insufficient. Please try again tomorrow." );
			break;
		  case 402:
			$('#js-error-message').html( "The usage limit has been reached, either you exceeded per day requests limits or your balance is insufficient. Please try again tomorrow." );
			break;
		  case 403: 
			$('#js-error-message').html( "You are not authorized to perform this operation." );
			break;
		  case 404: 
			$('#js-error-message').html( "The requested resource was not found." );
			break;
		  case 405:
			$('#js-error-message').html( "The requested method was not found." );
			break;
		  case 500: 
			$('#js-error-message').html( "Ops. Something went wrong. Please try again." );
			break;
		  case 503: 
			$('#js-error-message').html( "Our system is a bit busy at the moment and your request can’t be satisfied. Please try again later." );
			break;
		  
		  // if no errors then format data
		   default:
			formatSearchResults(data);
		  }
		},
		//work with any error
		error: function(jqXHR, textStatus, errorThrown) {
				alert('got to ERROR');
				console.log('jqXHR JSON.stringify = ' + JSON.stringify(jqXHR));
				console.log('textStatus =' + textStatus);
				console.log('errorThrown =' + errorThrown);

			$('#js-error-message').text(`Something went wrong doing artist/song title search: ${textStatus}`);
		},
		// When AJAX call is complete, will fire upon success AND when error is thrown
		complete: function() {
			//	console.log('doSearch AJAX call completed');
		}
	});
}


function getTrack(track_id, artist_name, track_name) {
	$.ajax({
		type: 'GET',
		//tell API what we want and that we want JSON
		data: {
			apikey: musixMatchApiKey,
			track_id: track_id,
			format: 'jsonp'
		},
		url: trackURL,
		// console.log the constructed url
		beforeSend: function(jqXHR, settings) {
			//	console.log('trackURL = ' + settings.url);
		},
		//tell jQuery to expect JSONP
		dataType: 'jsonp',
  		//work with the response
		success: function(data) {
			formatTrackResults(data, track_id, artist_name, track_name);
		},
		//work with any error
		error: function(jqXHR, textStatus, errorThrown) {
			//	console.log('jqXHR JSON.stringify = ' + JSON.stringify(jqXHR));
			//	console.log('textStatus =' + textStatus);
			//	console.log('errorThrown =' + errorThrown);

			$(`#${track_id}-Lyrics`).text(`Something went wrong getting lyrics from Musixmatch.com: ${textStatus}`);
		},
		// When AJAX call is complete, will fire upon success AND when error is thrown
		complete: function() {
			//	console.log('getTrack AJAX call completed');
		}
	});
}

function getNapsterAll(searchTerm) {
	const params = {
		apikey: napsterApiKey,
		query: searchTerm,
		per_type_limit: 10 // maximum number of results to return
	};
	const queryString = formatQueryParams(params);
	const url = napsterURL + '?' + queryString;
	// console.log('napsterURL = ' + url);

/*
ALTERNATIVE:
const napsterURL = 'https://api.napster.com/v2.2/search?apikey=${napsterApiKey}';
const url = napsterURL + `&query=${searchTerm}&per_type_limit=10`;
console.log('napsterURL = ' + url);
*/

	fetch(url)
		.then(response => {
			if (response.ok) {
				return response.json();
			}
			 response.json().then(err => {
				throw new Error(err);
			 });
		})
		.then(data => formatNapsterAllResults(data, searchTerm))
		.catch(err => {
			console.log(err);
			$('#NapsterAll').text(`Something went wrong getting NapsterAll info: ${err.error}: ${err.message}`);
		});
}

function getNapster(track_id, artist_name, track_name) {
	const params = {
		apikey: napsterApiKey,
		query: artist_name + ' ' + track_name,
		per_type_limit: 10 // maximum number of results to return
	};
	const queryString = formatQueryParams(params);
	const url = napsterURL + '?' + queryString;
	// console.log('napsterURL = ' + url);

/*
ALTERNATIVE:
const napsterURL = 'https://api.napster.com/v2.2/search?apikey=${napsterApiKey}';
const url = napsterURL + `&query=${artist_name}+${track_name}&per_type_limit=10`;
console.log('napsterURL = ' + url);
*/

	fetch(url)
		.then(response => {
			if (response.ok) {
				return response.json();
			}
			// response.json().then(err => {
				throw new Error(err);
			// });
		})
		.then(data => {
			// console.log('NAPSTER data = ' + JSON.stringify(data));
			formatNapsterResults(data, track_id, track_name);
		})
		.catch(err => {
			console.log(err);
			$(`#${track_id}-Napster`)
				.text(`Something went wrong getting Napster info: ${err.error}: ${err.message}`);
		});
}

// display search placeholder in input field, scroll up to search form, focus on input field, empty & hide results, empty errors
function resetForm() {
	$('#js-form')[0].reset();
	$('#js-search-term').attr('placeholder', 'Artist, Song or Lyrics...');
	$('html, body').animate({ scrollTop: $('header').offset().top });

	// clear errors
	$('#js-error-message').empty();

	// clear results list
	$('#results-list').empty();

	//hide the results section
	$('#results').addClass('hidden');
	
	// focus on input field
	$('#js-search-term').focus();

}

// ************************************************
// SCROLL TO TOP button
var offset = 100;
var duration = 500;
$(window).scroll(function() {
	if ($(this).scrollTop() > offset) {
		$('.back-to-top').fadeIn();
	} else {
		$('.back-to-top').fadeOut();
	}
});
$('.back-to-top').on('click', function(event) {
	event.preventDefault();
	$('html, body').animate({ scrollTop: 0 }, duration);
	// select contents of input field
	$('#js-search-term').select();
});

	
function watchForm() {
	$('form').on('click', '#js-search', function(event) {
		event.preventDefault();

		const searchTerm = $('#js-search-term').val();

		//check for empty input
		if (searchTerm === '') {
			resetForm();
			//check for whitespace input
		} else if (searchTerm.match(/^\s*$/)) {
			resetForm();
			// if input is valid, display loading graphic, empty result div, scroll to results, and run ajax & fetch calls to Musixmatch and Napster APIs*/
		} else {
			$('html, body').animate({ scrollTop: $('main').offset().top + 20 });
			$('#results-list').empty();
			$('#results-list').html('<img src="img/loader.gif" alt="loading...">');
			$('#results').removeClass('hidden');
			
			doSearch(searchTerm, options);
			getNapsterAll(searchTerm);
		}
	});
}

// default functions loaded in DOM when page loads:
//	1.  show search examples in placeholder
	const searchExamples = [
		'Want some suggestions?',
		'adele rolling in the deep',
		'the beatles all you need is love',
		'bad guy',
		'the police roxanne',
		'old town road',
		'jonas sucker',
		'of an emotional landslide'
	];
	setInterval(function() {
		$('#js-search-term').attr(
			'placeholder',
			searchExamples[searchExamples.push(searchExamples.shift()) - 1]
		);
	}, 2000); // every 2 seconds

//	2
$(watchForm);
