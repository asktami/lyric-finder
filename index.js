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

	if (data.message.body.track_list.length === 0) {
		$('#results-list').append(`
	<li>
	<h3>No Lyrics Found</h3>
	</li>`);
	} else {
		// iterate through the result array
		for (let i = 0; i < data.message.body.track_list.length; i++) {
			let item = data.message.body.track_list[i].track;
			let track_id = item.track_id;

			//	console.log('track_id = ' + track_id);
			//	console.log('item.track_name = ' + item.track_name);

			getTrack(item.track_id, item.artist_name, item.track_name);
			getNapster(item.track_id, item.artist_name, item.track_name);

			$('#results-list').append(`<li><h3>${item.track_name}</h3>
			Artist: ${item.artist_name}
			<br>Album: ${item.album_name}
			
		<div class="item">
			<div id="${track_id}-Lyrics" class="lyrics"></div>
			<div id="${track_id}-Napster" class="music"></div>
		</div>
	</li>`);
		}
	}
}

function formatTrackResults(data, track_id, artist_name, track_name) {
	let item = data.message.body.lyrics;
	let lyrics = item.lyrics_body;
	let track = track_name.split(' ').join('-');

	let output = `<a href="${linkURL}/${artist_name}/${track}" target="_blank">View Lyrics</a> on MusixMatch<br>`;

	output += lyrics ? `<br>Excerpt:<br><em>${lyrics}</em>` : '<br>';
	output += `<br><br>${item.lyrics_copyright}`;

	// output += (item.pixel_tracking_url !== undefined) ? `<img src="https://tracking.musixmatch.com/t1.0/${item.pixel_tracking_url}">` : `<script type="text/javascript" src="https://tracking.musixmatch.com/t1.0/${item.script_tracking_url}">`;

	// output += `<img src="https://tracking.musixmatch.com/t1.0/${item.pixel_tracking_url}" alt="tracking url">`;

	output += `<script type="text/javascript" src="https://tracking.musixmatch.com/t1.0/${
		item.script_tracking_url
	}">`;

	$(`#${track_id}-Lyrics`).html(output);
}

function formatNapsterResults(data, track_id, track_name) {
	let html_artwork = '';
	let currentTrack = '';
	let currentAlbum = '';
	let currentReleaseDate = '';

	let albums = data.search.data.albums;
	let tracks = data.search.data.tracks;

	// console.log('*** item = ' + data.search.data.albums[0].name);

	for (let i = 0; i < albums.length; i++) {
		let item = albums[i];

		// console.log('*** item = ' + JSON.stringify(item));

		let releaseDateTemp = item.originallyReleased.substring(0, 10);

		let releaseDateParts = releaseDateTemp.split('-');

		let releaseDateArr = [];
		releaseDateArr.push(releaseDateParts[1]);
		releaseDateArr.push(releaseDateParts[2]);
		releaseDateArr.push(releaseDateParts[0]);

		let releaseDate = releaseDateArr.join('/');

		// omit duplicate tracks from list
		/*
		console.log('item.name = ' + item.name );
		console.log('track_name = ' + track_name );
		console.log('currentTrack = ' + currentTrack );
		console.log('currentAlbum = ' + currentAlbum );
		console.log('tracks[i].albumName = ' + tracks[i].albumName );
		console.log('releaseDate = ' + releaseDate );
		console.log('currentReleaseDate = ' + currentReleaseDate );
		*/
		if (
			item.name.toLowerCase().includes(track_name.toLowerCase()) &&
			tracks[i].albumName !== currentAlbum &&
			releaseDate !== currentReleaseDate
		) {
		
			html_artwork += `<div data-track-id="${item.id}" style="background-image:url(https://api.napster.com/imageserver/v2/albums/${item.id}/images/300x300.jpg)" alt="${item.name} artwork" class="cover">
					<div class="content-name">${item.name}
							   <br>by ${item.artistName}
							   <br>${tracks[i].albumName}
							   <br>${releaseDate}
							 </div>
					 <audio controls="controls">
							   <source src="${tracks[i].previewURL}" type="audio/mpeg">
							 </audio>
					</div>`;
		}

		// save current track for comparison
		currentTrack = item.name;
		currentAlbum = tracks[i].albumName;
		currentReleaseDate = releaseDate;
	}

	$(`#${track_id}-Napster`).html(html_artwork);
}

function doSearch(searchTerm, options, limit = 1) {
	$.ajax({
		type: 'GET',
		//tell API what we want and that we want JSON
		data: {
			apikey: musixMatchApiKey,
			q: searchTerm,
			page_size: limit,
			page: 1,
			s_track_rating: 'desc',
			format: 'jsonp',
			callback: 'jsonp_callback'
		},
		url: searchURL,
		// console.log the constructed url
		beforeSend: function(jqXHR, settings) {
			//	console.log('searchURL = ' + settings.url);
		},
		//tell jQuery to expect JSONP
		dataType: 'jsonp',
		//the name of the callback functions
		jsonpCallback: 'jsonp_callback',
		contentType: 'application/json',
		//work with the response
		success: function(data) {
			formatSearchResults(data);
		},
		//work with any error
		error: function(jqXHR, textStatus, errorThrown) {
			//	console.log('jqXHR JSON.stringify = ' + JSON.stringify(jqXHR));
			//	console.log('textStatus =' + textStatus);
			//	console.log('errorThrown =' + errorThrown);

			$('#js-error-message')
				.text(`Something went wrong doing this search: ${textStatus}`)
				.addClass('.error-message');
		},
		// When AJAX call is complete, will fire upon success OR when error is thrown
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
			format: 'jsonp',
			callback: 'jsonp_callback'
		},
		url: trackURL,
		// console.log the constructed url
		beforeSend: function(jqXHR, settings) {
			//	console.log('trackURL = ' + settings.url);
		},
		//tell jQuery to expect JSONP
		dataType: 'jsonp',
		//the name of the callback functions
		jsonpCallback: 'jsonp_callback',
		contentType: 'application/json',
		//work with the response
		success: function(data) {
			formatTrackResults(data, track_id, artist_name, track_name);
		},
		//work with any error
		error: function(jqXHR, textStatus, errorThrown) {
			//	console.log('jqXHR JSON.stringify = ' + JSON.stringify(jqXHR));
			//	console.log('textStatus =' + textStatus);
			//	console.log('errorThrown =' + errorThrown);

			$(`#${track_id}-Lyrics`)
				.text(`Something went wrong getting track info: ${textStatus}`)
				.addClass('.error-message');
		},
		// When AJAX call is complete, will fire upon success OR when error is thrown
		complete: function() {
			//	console.log('getTrack AJAX call completed');
		}
	});
}

function getNapster(track_id, artist_name, track_name) {
	const params = {
		apikey: napsterApiKey,
		query: artist_name + ' ' + track_name,
		limit: 10
	};
	const queryString = formatQueryParams(params);
	const url = napsterURL + '?' + queryString;

	//	console.log('napsterURL = ' + url);

	/*
ALTERNATIVE:
const napsterURL = 'https://api.napster.com/v2.2/search';
const url = napsterURL + `${artist_name}+${track_name}&limit=10`;
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
		.then(data => formatNapsterResults(data, track_id, track_name))
		.catch(err => {
			$(`#${track_id}-Napster`)
				.text(
					`Something went wrong getting Napster info: ${err.error}: ${
						err.message
					}`
				)
				.addClass('.error-message');
		});
}

$(function() {
	$(document).on('click', '.js-reset', function(event) {
		// clear errors
		$('#js-error-message').empty();

		// clear results list
		$('#results-list').empty();

		//hide the results section
		$('#results').addClass('hidden');

		// focus on searchTerm
		$('.js-search-term').focus();
	});
});

function watchForm() {
	$('form').submit(event => {
		event.preventDefault();
		$('#results-list').empty();
		$('#results-list').html(
			'<div id="loader"><img src="loader.gif" alt="loading..."></div>'
		);
		$('#results').removeClass('hidden');

		const searchTerm = $('#js-search-term').val();
		const limit = $('#js-max-results').val();

		//	console.log('limit = ' + limit);

		doSearch(searchTerm, options, limit);
	});
}

$(watchForm);
