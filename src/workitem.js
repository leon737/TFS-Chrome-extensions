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
