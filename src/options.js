
// Saves options to chrome.storage.sync.
function save_options() {
  var tfs_url = document.getElementById('tfs_url').value;
    chrome.storage.sync.set({
    tfs_url: tfs_url    
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {  
  chrome.storage.sync.get({
    tfs_url: 'https://tfs-server:8080/projects_collection',
  }, function(items) {
    document.getElementById('tfs_url').value = items.tfs_url;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);

