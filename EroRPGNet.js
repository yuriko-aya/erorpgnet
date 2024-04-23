(function () {

    store_cross_data = function store_cross_data() {
        save_data = {}
        for (let i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          var value = localStorage.getItem(localStorage.key(i));
          save_data[key] = value;
        }
        var domain = window.location.hostname;
        var cross_play_id = localStorage.getItem("cross_play_id")
        delete save_data.cross_play
        delete save_data.cross_play_id
        var payload = {
            "cross_play_id": cross_play_id,
            "game": domain,
            "save_data": save_data
        }
        var xhr = new XMLHttpRequest();
        var url = "https://" + domain + "/cloud/save";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(payload))
    }
    
    fetch_cross_data = function fetch_cross_data() {
        var xhr = new XMLHttpRequest();
        var domain = window.location.hostname;
        var url = "https://" + domain + "/cloud/restore";
        var cross_play_id = localStorage.getItem("cross_play_id")
        var payload = {
            "cross_play_id": cross_play_id,
            "game": domain,
        }
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => {
            if (xhr.readyState == 4 && xhr.status == 200) {
                response = JSON.parse(xhr.responseText)
                new_save_data = response["save_data"] 
                Object.keys(new_save_data).forEach(function(key) {
                    var value = new_save_data[key]
                    localStorage.setItem(key, value)
                })
                window.location.reload()
            }
        }
        xhr.send(JSON.stringify(payload))
    }
    
    if (localStorage.getItem("cross_play") === null) {
        if(window.confirm("Do you want to enable cross-device play?")) {
            text = "Cross play enabled";
            localStorage.setItem("cross_play", "enabled");
        } else {
            localStorage.setItem("cross_play", "disabled");
        }
    }
    
    if (localStorage.getItem("cross_play") === "enabled" && localStorage.getItem("cross_play_id") === null) {
        let auth_code = prompt("Please enter your email. You can use fake email, just need to remeber it", null);
        let text;
        if (auth_code == null || auth_code == "" || auth_code == "null") {
            text = "No authentication code given, will disable cros-devie play"
            localStorage.setItem("cross_play", "disabled")
        } else {
            localStorage.setItem("cross_play", "enabled")
            localStorage.setItem("cross_play_id", auth_code)
            fetch_cross_data();
        }
    }
    
    if (localStorage.getItem("cross_play") === "enabled") {
        var _StorageManager_saveToWebStorage = StorageManager.saveToWebStorage;
        StorageManager.saveToWebStorage = function(savefileId, json) {
            _StorageManager_saveToWebStorage.call(this, savefileId, json);
            var key = this.webStorageKey(savefileId);
            var data = LZString.compressToBase64(json);
            localStorage.setItem(key, data);
            store_cross_data();
        };
    }
})();
