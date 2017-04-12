window.setInterval(tryInjectButtons, 1000);

function tryInjectButtons() {
	if (areButtonInjected()) return;
	var target = document.querySelector("div.info-text-wrapper");			
	if (target == null) return;	
	var container = document.createElement("span");
	container.id = getContainerId();
	addButtonsToContainer(container);
	target.append(container);
}

function areButtonInjected() {
	var target = document.getElementById(getContainerId());	
	return target != null;
}

function addButtonsToContainer(container) {
	addCopyTitleButton(container);
	addCopyCommitTitleButton(container);
	addCopyLinkButton(container);
	addCopyBranchButton(container);
	addPullRequestButton(container);
}

function addCopyTitleButton(container) {
	addButton(container, "Title", "Copy title", function() {
		executeCopy(getLinkElement().innerText + " " + getTitleElement().innerText);
	});
}

function addCopyCommitTitleButton(container) {
	addButton(container, "Commit", "Copy commit message", function() {
		executeCopy("#" + getLinkElement().href.match(/\d+$/) + " " + getTitleElement().innerText);
	});
}

function addCopyLinkButton(container) {
	addButton(container, "Link", "Copy link", function() {
		executeCopy(getLinkElement().href);
	});
}

function addCopyBranchButton(container) {
	addButton(container, "Branch", "Copy branch name", function() {
		executeCopy(getBranchName());
	});
}

function addPullRequestButton(container) {
	addButton(container, "Pull Request", "Prepares message for PR and opens the repositories", function() {
		
		chrome.storage.sync.get({
			tfs_url: 'https://tfs-server:8080/projects_collection',
		}, function(items) {
			var tfs_url = items.tfs_url;
			ajax.get(tfs_url + "/_apis/wit/workitems/" + getLinkElement().href.match(/\d+$/) + "?api-version=1.0&$expand=all", {}, function(data) {
				var response = JSON.parse(data);
				var repos = [];
				if (response.relations != undefined) {
					for(i = 0; i < response.relations.length; ++i) {
						var e = response.relations[i];
						if (e.rel == "ArtifactLink" && e.url.startsWith("vstfs:///Git/Commit/")) {
							var match = e.url.match(/vstfs:\/\/\/Git\/Commit\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}%2f([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
							var repo = match[1];						
							if (repos.indexOf(repo) == -1)
								repos.push(repo);
						}
					}
					for (i = 0; i < repos.length; ++i) {
						ajax.get(tfs_url + "/_apis/git/repositories/" + repos[i] + "?api-version=1.0", {}, function(data) {
							var response = JSON.parse(data);
							var url = response.remoteUrl;
							window.open(url, "_blank");
						});
					}				
				}									
			});
		});	

		var title = getLinkElement().innerText + " " + getTitleElement().innerText + "\r\n" + getLinkElement().href;
		executeCopy(title);
	});
}


function addButton(container, title, tooltip, cb){
	var btn = document.createElement("button");
	btn.innerText = title;
	btn.title = tooltip;
	btn.addEventListener("click", cb);
	container.append(btn);
}

function getLinkElement() {
	return document.querySelector(".info-text-wrapper>a");
}

function getTitleElement() {
	return document.querySelector(".info-text-wrapper>span.info-text");
}

function getContainerId() {
	return "tfs_plugin_buttons_container";
}

function getBranchName() {
	var linkTitle = getLinkElement().innerText;
	var match = linkTitle.match(/(.*?)\s+(\d+)/);
	var $class = match[1];
	var number = match[2];
	var result;
	switch($class.toLowerCase()){
		case "задача": 
			result = "feature";
			break;
		case "ошибка":
			result = "bug";
			break;
		case "issue":
			result = "issue";
			break;
	}
	return result + "s/" + result + "-" + number;
}

function executeCopy(text){
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.body.removeChild(copyDiv);
}


var ajax = {};
ajax.x = function () {
    if (typeof XMLHttpRequest !== 'undefined') {
        return new XMLHttpRequest();
    }
    var versions = [
        "MSXML2.XmlHttp.6.0",
        "MSXML2.XmlHttp.5.0",
        "MSXML2.XmlHttp.4.0",
        "MSXML2.XmlHttp.3.0",
        "MSXML2.XmlHttp.2.0",
        "Microsoft.XmlHttp"
    ];

    var xhr;
    for (var i = 0; i < versions.length; i++) {
        try {
            xhr = new ActiveXObject(versions[i]);
            break;
        } catch (e) {
        }
    }
    return xhr;
};

ajax.send = function (url, callback, method, data, async) {
    if (async === undefined) {
        async = true;
    }
    var x = ajax.x();
    x.open(method, url, async);
    x.onreadystatechange = function () {
        if (x.readyState == 4) {
            callback(x.responseText)
        }
    };
    if (method == 'POST') {
        x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    x.send(data)
};

ajax.get = function (url, data, callback, async) {
    var query = [];
    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, async)
};

ajax.post = function (url, data, callback, async) {
    var query = [];
    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    ajax.send(url, callback, 'POST', query.join('&'), async)
};