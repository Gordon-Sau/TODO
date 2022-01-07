const defaultURL = "javascript:void(0)";

getItems(null, console.log);

getDataWithTable("groupTable").then(([groupTable, data])=>{
    const fragment = document.createDocumentFragment();
    groupTable.forEach(key=>{
        fragment.appendChild(createGroupComponent(key, data[key]));
    });
    document.getElementById("container").appendChild(fragment);
});

document.getElementById("addGroup").addEventListener("click", ()=>{
    const title = window.prompt("Please enter the title of the group in the box.");
    if (title === null) return;
    if (title.replace("/", " ").trim() === "")
        return window.alert("The title will be empty. Please try with another input.");

    getItems([title, "groupTable"], data=>[data.title, data["groupTable"]]).then(([content, table])=>{
        if (content === undefined) {
            table.push(title);
            setItems({
                [title]: [],
                groupTable: table
            }).then(()=>{
                document.getElementById("container").appendChild(
                    createGroupComponent(title, [])
                );
            });
        } else {
            window.alert("You have already created a group with the same title.");
        }
    });
});

function createGroupComponent(key, value) {
    const groupHeader = document.createElement("h2");
    groupHeader.innerText = key;
    groupHeader.setAttribute("data-key", key);
    groupHeader.classList = ["group-header"];

    const div = document.createElement("div");
    div.classList = ["group"];
    div.appendChild(groupHeader);
    const container = document.createElement("div");
    container.classList = ["group-container"]
    value.forEach((item)=>{
        const element = createItem(key, item);
        container.appendChild(element);
    });
    div.appendChild(container);
    return div;
}

function createItem(key, item) {
    if (typeof item === "string")
        return createSubgroup(key, item);
    return createLeaf(item);
}

function createSubgroup(parentKey, item) {
    const key = parentKey+'/'+item;
    const header = document.createElement("div");
    header.setAttribute("data-key", key);
    header.classList = ["subgroup", "not-expanded"];
    const text = document.createTextNode(item);
    header.appendChild(text);
    header.onclick = ()=>firstClickSubgroup(key, header);
    return header;
}

function insertAfter(newNode, refNode) {
    return refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
}

function firstClickSubgroup(key, header) {
    const div = document.createElement("div");
    div.className = "subgroup-child-container";
    getDataWithTable(key).then(([childrenKeys, data])=>{
        childrenKeys.forEach(childKey=>{
            div.appendChild(createItem(key, data[childKey]));
        });
        insertAfter(div, header);
        header.classList[1] = "expanded";
        header.onclick = ()=>clickMiniSubgroup(header, div);
    });
}

function clickExpandSubgroup(header, div) {
    div.style.display = "block";
    header.classList[1] = "expanded";
    header.onclick = ()=>clickMiniSubgroup(header);
}

function clickMiniSubgroup(header, div) {
    div.style.display = "none";
    header.classList[1] = "not-expanded";
    header.onclick = ()=>clickExpandSubgroup(header);
}

function createLeaf(item) {
    const element = document.createElement("a");
    element.innerText = item.title;
    element.href = item.url;
    element.target = "new";
    element.rel = "noopener";
    return element;
}

function getDataWithTable(tableName) {
    return new Promise(resolve=>{
        getItems(tableName, result=>result[tableName]).then(table=>{
            getItems(table.map(key=>key)).then(data=>{
                resolve([table, data]);
            });
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

function setItems(data) {
    return new Promise((resolve)=>{
        chrome.storage.local.set(data, resolve);
    });
}

function addTask(parentKey, taskList, task) {
    taskList.push(task);
    return setItems({
        [parentKey]: taskList
    });
}

function removeTask(parentKey, taskList, taskIndex) {
    taskList.splice(taskIndex, 1);
    return setItems({
        [parentKey]: taskList
    });
}

function changeTaskContent(parentKey, taskList, taskIndex, content) {
    taskList[taskIndex].title = content;
    return setItems({
        [parentKey]: taskList
    });
}

function changeUrl(parentKey, taskList, taskIndex, url) {
    taskList[taskIndex].url = url;
    return setItems({
        [parentKey]: taskList
    });
}

async function changeSubgroupName(parentKey, index, oldName, newName) {
    const oldKey = parentKey+'/'+oldName;
    const newKey = parentKey+'/'+newName;
    const [siblings, children] = await getItems([parentKey, oldKey], val=>[val[parentKey], val[oldKey]]);
    if (siblings[index] !== oldName) {
        console.log(`${siblings[index]} !== ${oldName}`);
        return //location.reload();
    }
    siblings[index] = newName;
    await new Promise(resolve=>chrome.storage.local.remove(oldName));
    return await setItems({
        [parentKey]: siblings,
        [newKey]: children
    });
}

function removeSubgroup(parentKey, siblings, index, subgroupName) {
    if (siblings[index] !== subgroupName) {
        console.log(`${siblings[index]} !== ${oldName}`);
        return // location.reload();
    }
    siblings.splice(index, 1);
    return setItems({[parentKey]: siblings}).then(()=>chrome.storage.local.remove(parentKey+'/'+subgroupName));
}

function removeGroup(siblings, index, subgroupName){
    if (siblings[index] !== subgroupName) {
        console.log(`${siblings[index]} !== ${oldName}`);
        return // location.reload();
    }
    siblings.splice(index, 1);
    return setItems({groupTable: siblings}).then(()=>chrome.storage.local.remove(subgroupName));
}

function removeTask(parentkey, siblings, index, task) {
    if (siblings[index] !== task) {
        console.log(`${siblings[index]} !== ${task}`);
        return // location.reload();
    }
    siblings.splice(index, 1);
    return setItems({[parentkey]:siblings});
}

// function moveGroup(oldParentKey, oldSiblings, oldIndex, newParentKey, newSiblings, newIndex, subgroupName){
    
// }

async function moveSubgroup(oldParentKey, oldSiblings, oldIndex, newParentKey, newSiblings, newIndex, subgroupName){
    if (oldSiblings[oldIndex] !== subgroupName) {
        console.log(`${oldSiblings[oldIndex]} !== ${subgroupName}`);
        return // location.reload();
    }
    newSiblings.splice(newIndex, 0, subgroupName);
    oldSiblings.splice(oldIndex, 1);
    if (oldParentKey !== newParentKey) {
        getItems(ol)
    }
    return await setItems({
        [oldParentKey]: oldSiblings,
        [newParentKey]: newSiblings,
    });
}

function moveTask(oldParentKey, oldTaskList, oldTaskIndex, newParentKey, newTaskList, newTaskIndex, task) {
    newTaskList.splice(newTaskIndex, 0, task);
    oldTaskList.splice(oldTaskIndex, 1);
    return setItems({
        [oldParentKey]: oldTaskList,
        [newParentKey]: newTaskList
    });
}

/* may add notifications as a feature in the future
function addNotification() {

}

function removeNotification() {

}

function changeNotification() {
    // change message
    // change time
}
*/

// remove when done
// window.onbeforeunload = e=>chrome.storage.local.clear();