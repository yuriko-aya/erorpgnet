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
    
    is_cheat_enabled = function() {
        if(localStorage.getItem("cheat") === "enabled") {
            return true;
        } else {
            return false;
        }
    }

    var _Game_party_prototype_gainGold = Game_Party.prototype.gainGold;
    Game_Party.prototype.gainGold = function(amount) {
        if (amount < 0 || ! is_cheat_enabled()) {
            new_amount = amount;
        } else {
            new_amount = amount * 1000;
        }
        _Game_party_prototype_gainGold.call(this, new_amount);
        // this._gold = (this._gold + new_amount).clamp(0, this.maxGold());
    }

    var _Game_party_prototype_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {

        if (amount < 0 || ! is_cheat_enabled()) {
            new_amount = amount;
        } else {
            new_amount = amount + 99;
        }
        _Game_party_prototype_gainItem.call(this, item, new_amount, includeEquip);
    
    }

    var _Game_actor_prototype_gainExp = Game_Actor.prototype.gainExp;
    Game_Actor.prototype.gainExp = function(exp) {
        if (is_cheat_enabled()) {
            var newExp = exp * 1000
        } else {
            var newExp = exp;
        }
        _Game_actor_prototype_gainExp.call(this, newExp);
    };
    
    var _Game_Action_prototype_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        if ("_enemyId" in target && is_cheat_enabled()) {
            var new_value = (value + 1) * 1000;
        } else {
            var new_value = value;
        }
        _Game_Action_prototype_executeDamage.call(this, target, new_value);
    };


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

    var _DataManager_saveGame = DataManager.saveGame;
    DataManager.saveGame = function(savefileId) {
        if (savefileId === 1) {
            alert("Do not use first save slot! it will be used for auto save!");
            return false;
        } else {
            try {
                StorageManager.backup(savefileId);
                return this.saveGameWithoutRescue(savefileId);
            } catch (e) {
                console.error(e);
                try {
                    StorageManager.remove(savefileId);
                    StorageManager.restoreBackup(savefileId);
                } catch (e2) {
                }
                return false;
            }
        }
    };
 
    var _StorageManager_saveGameWithoutRescue = DataManager.saveGameWithoutRescue;
    DataManager.saveGameWithoutRescue = function(savefileId) {
        var save_content = DataManager.makeSaveContents()
        if (save_content.system._versionId != 0) {
            console.log("Saving to to slot " + savefileId)
            _StorageManager_saveGameWithoutRescue.call(this, savefileId);
            if (localStorage.getItem("cross_play") === "enabled") {
                store_cross_data();
            }
            return true
        }
    };
    
    setInterval(function() {
        DataManager.saveGameWithoutRescue(1)
    }, 60 * 1000);

    this.addEventListener('keyup', event => {
        if (event.keyCode == 67) {
            if(localStorage.getItem("cheat") === "enabled") {
                if(window.confirm("Cheat mode is activated, Do you want to deactivate it?")) {
                    localStorage.removeItem("cheat")
                }
            } else {
                if(window.confirm("Cheat mode is not activated, Do you want to activate it?")) {
                    localStorage.setItem("cheat", "enabled")
                }
            }
        }
    })

})();
