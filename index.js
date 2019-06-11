
'use strict';

// for MusixMatch API search, so can search by LYRICS or ARTIST or SONG
const proxyURL = 'https://cors-anywhere.herokuapp.com/'; 	// to get around CORS error
const apiKey = '2795af8d7036855a62070800dc64131d'; 
const searchURL = 'https://api.musixmatch.com/ws/1.1/track.search';
const trackURL = 'https://api.musixmatch.com/ws/1.1/track.lyrics.get';

// link to MusixMatch artist search results, when no results found at api.lyrics.ovh
const linkURL = 'https://www.musixmatch.com/lyrics';

// to iTunes API
// to search for content within the iTunes Store, App Store, iBooks Store and Mac App Store
// default country is US
// default media is all
// default number of records (limit) is 50
// default language is en (English)
// flag indicating whether or not you want to include explicit content in your search results. The default is Yes. 
const iTunesURL = 'https://itunes.apple.com/search';


const options = {
  mode: 'no-cors',
  headers: new Headers({
    "Access-Control-Allow-Origin": "*"
	})
};

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

function formatSearchResults(data) {
  // if there are previous results, remove them
  $('#results-list').empty();
    
  // iterate through the result array
  for (let i = 0; i < data.message.body.track_list.length; i++){
  
    let item = data.message.body.track_list[i].track;
    let track_id = item.track_id;
     
   	getTrack(item.track_id, item.artist_name, item.track_name);
   	getiTunes(item.track_id,item.artist_name, item.track_name);

	$('#results-list').append(`
	<li>
	<h3>${item.track_name} by ${item.artist_name} </h3>
	<div style="display: flex">
	<div>
	<p id="${track_id}-lyrics" style="white-space: pre-wrap;"></p>
	<p id="${track_id}-track_excerpt" style="white-space: pre-wrap;"></p>
	</div>
	
	<div id="${track_id}-iTunes"</div>
	</div>
	</li>`);
    
    };
};

function formatTrackResults(data, track_id, artist_name, track_name) {

    let item = data.message.body.lyrics;
    let lyrics = item.lyrics_body;
    let track = track_name.split(' ').join('-');
    
    let output = '';
    
    output += `<p>`;
    
    output += `<a href="${linkURL}/${artist_name}/${track}" target="_blank">View Lyrics</a> on MusixMatch<br>`;
    
    output +=  lyrics ? `<br>Excerpt:<br><em>${lyrics}</em>` : '<br>';
    output += `<br>&copy; ${item.lyrics_copyright}<br>`;
    
	// output += `<img src="https://tracking.musixmatch.com/t1.0/${item.pixel_tracking_url}" alt="tracking url">`;
	output += `<script type="text/javascript" src="https://tracking.musixmatch.com/t1.0/${item.script_tracking_url}">`;
    output += `</p>`;
    
	$(`#${track_id}-lyrics`).html(output);
	
};


function formatiTunesResults(data, track_id, track_name) {
	let html_artwork = '';
	
	let currentTrack = '';
	let currentAlbum = '';
	let currentReleaseDate = '';
	
    for (let i = 0; i < data.results.length; i++){
    
		let item = data.results[i];
		
		let releaseDateTemp = item.releaseDate.substring(0,10);
		
		let releaseDateParts = releaseDateTemp.split("-");
		
		let releaseDateArr = [];
		releaseDateArr.push(releaseDateParts[1]);
		releaseDateArr.push(releaseDateParts[2]);
		releaseDateArr.push(releaseDateParts[0]);
		
		let releaseDate = releaseDateArr.join("/");
		
		// omit duplicate tracks from list
    	if(item.trackName.includes(track_name) && item.trackName !== currentTrack && item.collectionName !== currentAlbum && releaseDate !== currentReleaseDate){
		
		html_artwork += `<div style="display: flex;">
		
		<div><a href="${item.trackViewUrl}" alt="track ${track_id}" target="_blank"><img src="${item.artworkUrl100}" alt="${item.trackName} artwork"></a></div>
		
		<div>Artist: ${item.artistName}
		<br>Track: ${item.trackName}
		<br>Album: ${item.collectionName}
		<br>Release Date: ${releaseDate}
		<br><a href="${item.trackViewUrl}" alt="track ${track_id}" target="_blank">Preview<a> on Apple Music
		<br>
		
		 <audio controls="controls" preload="none">
		 <source src="${item.previewUrl}" type="audio/mp4" />
		 Your browser does not support HTML5 audio.
		 </audio>
		</div>
		
		</div>
		`;		
		
    	}
    	
    	// save current track for comparison
    	currentTrack = item.trackName;
		currentAlbum = item.collectionName;
		currentReleaseDate = releaseDate;
    }
    
   $(`#${track_id}-iTunes`).html(html_artwork);
		
};


function doSearch(searchTerm, options, limit=1) {  
  $.ajax({
    type: 'GET',
    //tell API what we want and that we want JSON
    data: {
        apikey: apiKey,
        q: searchTerm,
    	page_size: limit,
    	page: 1,
    	s_track_rating: 'desc',
        format:'jsonp',
        callback:'jsonp_callback'
    },
    url: searchURL,
    // console.log the constructed url
    beforeSend: function(jqXHR, settings) {
    	// console.log('searchURL = ' + settings.url);
  	},
    //tell jQuery to expect JSONP
    dataType: 'jsonp',
    //the name of the callback function
    jsonpCallback: 'jsonp_callback',
    contentType: 'application/json',
    //work with the response
    success: function(data) {
    		formatSearchResults(data);
           },
    //work with any error
    error: function(jqXHR, textStatus, errorThrown) {
       // console.log('jqXHR JSON.stringify = ' + JSON.stringify(jqXHR));
       // console.log('textStatus =' + textStatus);
       // console.log('errorThrown =' + errorThrown);
        
        $('#js-error-message').text(`Something went wrong doing this search: ${textStatus}`).addClass('error-message');

    },
    // When AJAX call is complete, will fire upon success OR when error is thrown
    	complete: function() {
       // console.log('doSearch AJAX call completed');
	}
  });
  
}

function getTrack(track_id, artist_name, track_name, options) {  
  $.ajax({
    type: 'GET',
    //tell API what we want and that we want JSON
    data: {
        apikey: apiKey,
        track_id: track_id,
        format:'jsonp',
        callback:'jsonp_callback'
    },
    url: trackURL,
    // console.log the constructed url
    beforeSend: function(jqXHR, settings) {
    	//console.log('trackURL = ' + settings.url);
  	},
    //tell jQuery to expect JSONP
    dataType: 'jsonp',
    //the name of the callback function
    jsonpCallback: 'jsonp_callback',
    contentType: 'application/json',
    //work with the response
    success: function(data) {
    		formatTrackResults(data, track_id, artist_name, track_name);
           },
    //work with any error
    error: function(jqXHR, textStatus, errorThrown) {
       // console.log('jqXHR JSON.stringify = ' + JSON.stringify(jqXHR));
       // console.log('textStatus =' + textStatus);
       // console.log('errorThrown =' + errorThrown);
         
        $(`#${track_id}-lyrics`).text(`Something went wrong getting track info: ${textStatus}`).addClass('error-message');
    },
    // When AJAX call is complete, will fire upon success OR when error is thrown
    	complete: function() {
      //  console.log('getTrack AJAX call completed');
	}
	
  });
}



function getiTunes(track_id, artist_name, track_name, options) {
$.ajax({
    type: 'GET',
    //tell API what we want and that we want JSON
    data: {
        term: artist_name + " " + track_name,
    	limit: 10,
        format:'jsonp',
        callback:'jsonp_callback'
    },
    url: iTunesURL,
    // console.log the constructed url
    beforeSend: function(jqXHR, settings) {
    	console.log('iTunesURL = ' + settings.url);
  	},
    //tell jQuery to expect JSONP
    dataType: 'jsonp',
    //the name of the callback function
    jsonpCallback: 'jsonp_callback',
    contentType: 'application/json',
    //work with the response
    success: function(data) {
    		formatTrackResults(data, track_id, artist_name, track_name);
           },
    //work with any error
    error: function(jqXHR, textStatus, errorThrown) {
       // console.log('jqXHR JSON.stringify = ' + JSON.stringify(jqXHR));
       // console.log('textStatus =' + textStatus);
       // console.log('errorThrown =' + errorThrown);
         
    $(`#${track_id}-iTunes`).text(`Something went wrong getting Apple Music info: ${err.error}: ${err.message}`).addClass('error-message');
    },
    // When AJAX call is complete, will fire upon success OR when error is thrown
    	complete: function() {
      //  console.log('getTrack AJAX call completed');
	}
	
  });
  

 
}

$(function() { 
     $(document).on('click', '.js-reset', function(event){
     
     
	 // clear errors
	 $('#js-error-message').empty();
	 
	 // clear results list
	 $('#results-list').empty();
	 
	 //hide the results section  
	 $('#results').addClass('hidden');

	 // focus on searchTerm
	 $('.js-search-term').focus();

    });
})

function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
    $('#results-list').empty();
    $('#results-list').html('<div id="loader"><img src="loader.gif" alt="loading..."></div>');
  $('#results').removeClass('hidden');
     
    const searchTerm = $('#js-search-term').val();  
    doSearch(searchTerm, options, 1);
  });
}

$(watchForm);