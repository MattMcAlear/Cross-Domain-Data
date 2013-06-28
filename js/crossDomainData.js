// Purpose:	Server transmit data accross domains, ports, and SSL connections.
// By: 		Matt McAlear
// Date:	6/28/13

function CrossDomainData(origin, path){
    this.origin 		= origin;
    this.path 			= path;
    this.whitelist 		= [];
    this._type 			= '';
    this._iframe 		= null;
    this._iframeReady 	= false;
}

CrossDomainData.prototype = {
	//restore constructor
	constructor: CrossDomainData,
	
	init: function(){
		var that = this;
		
		if(!this._iframe){
			if (window.postMessage && window.JSON && window.localStorage){
                this._iframe = document.createElement("iframe");
                this._iframe.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;";
                document.body.appendChild(this._iframe);

                if (window.addEventListener){
                    this._iframe.addEventListener("load", function(){ that._iframeLoaded(); }, false);
                    window.addEventListener("message", function(event){ that._handleMessage(event); }, false);
                } else if (this._iframe.attachEvent){
                    this._iframe.attachEvent("onload", function(){ that._iframeLoaded(); }, false);
                    window.attachEvent("onmessage", function(event){ that._handleMessage(event); });
                }
            } else {
                throw new Error("Unsupported browser!");
            }
        }
        
        this._iframe.src = this.origin + this.path;
            
	},
	
	requestData: function(key, type){
		var data = {
			type: type,
           	key: key
        };
        
        this._type=type;
        
        if(this._iframeReady){
            this._sendRequest(data);
            return true;
        }

        if(!this._iframe){
            this.init();
            return false;
        }
	},
	
	//Private methods
	_sendRequest: function(data){
    	this._iframe.contentWindow.postMessage(data.key, this.origin);
    },
	
	_iframeLoaded: function(){
        this._iframeReady = true;
    },
	
	_handleMessage: function(event){
		if(event.origin == this.origin){
			this._saveData(event.data, this._type);
		}
	},
	
	_saveData: function(data, type){
		var store = JSON.parse(data);
		switch(type){
			case 'local':
				localStorage.setItem(store.key, store.value);
				break;
			case 'session':
				sessionStorage.setItem(store.key, store.value);
				break;
			case 'cookie':
				var exdays=1; //simple for now
				var exdate=new Date();
				exdate.setDate(exdate.getDate() + exdays);
				var c_value=escape(store.value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
				document.cookie=store.key + "=" + c_value;
				break;
		}
		console.log("saved data successfully: "+store.key+'='+store.value);
	}
}