checkUpdates();
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	var d1 = +(new Date());

	const body = 'fen=' + request.fen + '&color=' + request.color + '&autoClick=' + request.autoClick + '&currentSite=' + request.currentSite;

	fetch("http://localhost:2727", { 
		method: "POST",
		body: body,
		headers: { 'Content-Type': 'application/json' }
	})
	.then(resp => resp.text())
	.then(resp => {
		if (resp === 'Error: No move is available') {
			sendResponse({status: false, error: 'You have 0 moves available'});
		} else {
			var info = resp.split('ponder');
			var d2 = +(new Date());
			var diff = (d2 - d1) / 1000 + ' s';			
			sendResponse({status: true, move: info[0], ponder: info[1], time: diff});			
		}


	}).catch(error => {
		console.log(error);
		sendResponse({status: false});

	})
	return true;
});


chrome.action.onClicked.addListener(function(tab) {
	chrome.runtime.openOptionsPage();
})


function checkUpdates() {
	var url = 'https://chess-master.info/json/update.json';
	fetch(url).then(response => {
		return response.json();
	}).then(data => {
		if (data && data.lichessSelector) {
			var obj = {
				lichessSelector: data.lichessSelector,
				autoStep: data.autoStep || 'Auto Step'
			};
			chrome.storage.sync.set(obj, function() {
				console.log('update ',obj);
			});   
		}
	});
}