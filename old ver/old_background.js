chrome.runtime.onInstalled.addListener(()=>{
    createContextMenus();
    const defaultGroupName = "New Tasks"
    chrome.storage.local.set({
        "groupTable": [defaultGroupName],
        "defaultGroup": defaultGroupName,
        [defaultGroupName]: [],
    });
    chrome.action.onClicked.addListener((curr)=>{
        chrome.tabs.query({currentWindow: true, audible: false}).then((tabs)=>{
            items = tabs.map(val=>{
                return {
                    url: val.url,
                    title: val.title
                    // can add more data if needed
                }
            });
            getItems("defaultGroup", ({defaultGroup})=>(defaultGroup === undefined? defaultGroupName: defaultGroup)).then(defaultGroup=>{
                chrome.storage.local.get(defaultGroup, data=>{
                    chrome.storage.local.set({
                        [defaultGroup]: ( data[defaultGroup] === undefined? items: concatItems(items, data[defaultGroup]) )
                    }, ()=>{
                        // can be set in option
                        // chrome.tabs.remove(tabs.map(tab=>tab.id));
                        chrome.tabs.create({url: "main.html"});
                        // chrome.windows.create({url: "main.html"});
                    });
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

function getItems(key, func){
    if (func !== undefined) 
        return new Promise((resolve)=>{
            chrome.storage.local.get(key, data=>resolve(func(data)));
        });
    return new Promise(resolve=>{
        chrome.storage.local.get(key, data=>resolve(data));
    });
}

function concatItems(newData, oldData) {
    const urlSet = new Set(oldData.filter(val=>typeof val !== "string").map(obj=>obj.url));
    return newData.filter(val=>!(urlSet.has(val.url))).concat(oldData);
}