window.setInterval(tryInjectButtons, 1000);

function tryInjectButtons() {
	tryInjectBoardButtons();
	tryInjectWorkitemButtons();
}

function tryInjectButtonsToContainer(selector, check, containerSelector, injector) {
	if (check()) return;
	var target = document.querySelector(selector);			
	if (target == null) return;	
	var container = document.createElement("span");
	container.id = containerSelector();
	injector(container);
	target.append(container);
}

function tryInjectBoardButtons() {
	tryInjectButtonsToContainer("div.hub-title", areBoardButtonInjected, getBoardButtonsContainerId, addButtonsToBoardButtonsContainer);	
}

function tryInjectWorkitemButtons() {
	tryInjectButtonsToContainer("div.info-text-wrapper", areWorkitemButtonInjected, getWorkitemButtonsContainerId, addButtonsToWorkitemButtonsContainer);	
}

function areBoardButtonInjected() {
	var target = document.getElementById(getBoardButtonsContainerId());	
	return target != null;
}

function areWorkitemButtonInjected() {
	var target = document.getElementById(getWorkitemButtonsContainerId());	
	return target != null;
}

function addButtonsToBoardButtonsContainer(container) {
	addCollapseAllButton(container);
	addOnlyUnassignedButton(container);
	addOnlyAssignedToMeButton(container);
}

function addButtonsToWorkitemButtonsContainer(container) {
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

function addCollapseAllButton(container) {
	addButton(container, "Collapse all", "Collapse all panes", function() {
		collapseAllPanes();
	});
}

function expandPane(paneTitle) {
	var panes = document.querySelectorAll("span.witTitle>span.ellipsis");
		for(i = 0; i < panes.length; ++i) {
			var pane = panes[i];
			if (pane.innerText == paneTitle) {
				pane.click();
			}
		}
}

function addOnlyUnassignedButton(container) {
	addButton(container, "Unassigned", "Collapse all panes except unassigned", function() {
		collapseAllPanes();
		expandPane("Unassigned");
	});
}

function addOnlyAssignedToMeButton(container) {
	addButton(container, "Assigned to me", "Collapse all panes except assigned to me", function() {
		collapseAllPanes();
		var userName = document.querySelector("ul.user-menu span.text").innerText;
		collapseAllPanes();
		expandPane(userName);
	});
}

function addButton(container, title, tooltip, cb){
	var btn = document.createElement("button");
	btn.className = "tfs_link_button";
	btn.innerText = title;
	btn.title = tooltip;
	btn.addEventListener("click", cb);
	container.append(btn);
}

function collapseAllPanes() {
	var panes = document.querySelectorAll('tr.taskboard-row>td.taskboard-expander>div.minimize');
	for(i = 0; i < panes.length; ++i)
	{
		var pane = panes[i];
		if (pane.parentElement.parentElement.style["display"] != "none")
			pane.click();
	}
}

function getLinkElement() {
	return document.querySelector(".info-text-wrapper>a");
}

function getTitleElement() {
	return document.querySelector(".info-text-wrapper>span.info-text");
}

function getBoardButtonsContainerId() {
	return "tfs_plugin_board_buttons_container";
}

function getWorkitemButtonsContainerId() {
	return "tfs_plugin_wi_buttons_container";
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