chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    // console.log(sender);
	if (request == "Action") {
		toggleRuby();
	}
});

function toggleRuby() {
    let rtList = document.querySelectorAll('rt');
    console.log('rt count %s', rtList.length);
    if( rtList.length > 0 ){
        let currentStyle = document.defaultView.getComputedStyle(rtList[0],null).display;
        let visible = currentStyle == 'block';
        console.log(currentStyle, visible);
        rtList.forEach(function(a,b,c){toggle(a,visible);});
    }else{
        console.log('no rb tags');
    }
}

function toggle(element, currentVisible){
    if(currentVisible){
        element.style.display='none';
    }else{
        element.style.display='block';
    }
}