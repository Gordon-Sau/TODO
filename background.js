chrome.runtime.onInstalled.addListener(()=>{
    createContextMenus();
    const defaultGroupName = "New Tasks";
    const defaultIndex = -1;
    const defaultSetting = {
        "defaultGroup": {
            index: defaultIndex,
            name: defaultGroupName
        },
        "data": [{
            name: defaultGroupName,
            children: []
        }]
    };
    chrome.storage.local.set(defaultSetting);

    chrome.action.onClicked.addListener((curr)=>{
        chrome.tabs.query({
            currentWindow: true
            // , audible: false
        }).then((tabs)=>{
            items = tabs.map(val=>{
                return {
                    url: val.url,
                    content: val.title
                    // can add more data if needed
                }
            });
            getItems(["defaultGroup", "data"]).then(({defaultGroup, data})=>{
                let query = {};
                if (data === undefined) {
                    data = defaultSetting["data"];
                } else if (defaultGroup === undefined || data.length <= defaultGroup.index) {
                    defaultGroup.index = defaultIndex;
                    query = {defaultGroup: defaultGroup};
                }
                if (defaultGroup.index < 0) {
                    data.unshift({
                        name: defaultGroup.name,
                        children: items
                    });
                    defaultGroup.index = 0;
                    query = {defaultGroup: defaultGroup};
                } else {
                    data[defaultGroup.index].children = concatItems(items, data[defaultGroupIndex].children);
                }
                query["data"] = data;
                setItems(query).then(()=>{
                    // can be set in option
                    // chrome.tabs.remove(tabs.map(tab=>tab.id));
                    chrome.tabs.create({url: "main.html"});
                    // chrome.windows.create({url: "main.html"});
                });
            });
        });
    });
});

function createContextMenus(){
    const root = chrome.contextMenus.create({
        "id": "TODO menu",
        "title": "//TODO",
        "contexts": ["all"],
    });
    /*
    createContextMenusChildren(root, [{
        id: "main",
        title: "main page"
    }]);
    */
}

function createContextMenusChildren(parent, children) {
    children.forEach(val=>{
        chrome.contextMenus.create({
            "id": val.id,
            "title": val.title,
            "parentId": parent,
            "contexts": ["all"]
        });
    });
}

function getItems(key){
    return new Promise(resolve=>{
        chrome.storage.local.get(key, data=>resolve(data));
    });
}

function setItems(query) {
    return new Promise(resolve=>chrome.storage.local.set(query, resolve));
}

function concatItems(newData, oldData) {
    const urlSet = new Set(oldData.filter(item=>!Array.isArray(item)).map(val=>val.url));
    return newData.filter(val=> (val.url === "javascript:void(0)") || !(urlSet.has(val.url))).concat(oldData);
}
