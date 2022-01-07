const globalContainer = document.getElementById("container");
const voidUrl = "javascript:void(0)";
// MARK: Storage
class LocalStorage {
    static getItems(query) {
        return new Promise(resolve=>chrome.storage.local.get(query, resolve));
    }

    static setItems(query) {
        return new Promise(resolve=>chrome.storage.local.set(query, resolve));
    }

    static removeItems(query) {
        return new Promise(resolve=>chrome.storage.local.remove(query, resolve));
    }
    static addObject(parent, index, object) {
        parent.splice(index, 0, object);
    }
    
    static removeObject(parent, index) {
        parent.splice(index, 1);
    }
    
    static async save(){
        await LocalStorage.setItems({
            data: globalContainer.parentElement.objectMap,
            defaultGroup: {
                index: getDefaultGroupIndex(),
                name: await LocalStorage.getItems("defaultGroup").then(({defaultGroup})=>defaultGroup.name)
            }
        });
        const {data, defaultGroup} = await LocalStorage.getItems(null);
        console.log({
            data: data,
            body: globalContainer.parentElement,
            defaultGroup: defaultGroup
        });
    }
}

// MARK: Component
class Component {
    static toGroupComponent(object, data) {
        const div = document.createElement("div");
        div.classList = ["group"];
        div.draggable = true;
        div.objectMap = object;
        div.parentObjectMap = data;
        const groupHeader = createGroupHeader(object.name);
        div.appendChild(groupHeader);
        const container = document.createElement("div");
        container.classList = ["group-children-container"];
        object.children.forEach(item=>{
            container.appendChild(Component.createComponent(item, object));
        });
        container.ondragover = ev=>dragover(ev, container);
        div.appendChild(container);
        div.ondragstart = ev=>dragstart(ev, div)
        div.ondragend = ev=>groupDragend(ev, div);
        return div;
    }

    static toSubgroupComponent(object, parent) {
        const div = document.createElement("div");
        div.className = "subgroup";
        div.objectMap = object;
        div.parentObjectMap = parent;
        div.draggable = true;
        const header = createSubgroupHeader(object.name);
        div.appendChild(header);
        const childrenContainer = document.createElement("div");
        childrenContainer.className = "children-container";
        object.children.forEach(item=>{
            childrenContainer.appendChild(Component.createComponent(item, object));
        });
        childrenContainer.style.display = "none";
        childrenContainer.dragover = ev=>dragover(ev, childrenContainer);
        div.ondragstart = ev=>dragstart(ev, div);
        div.ondragend = ev=>dragend(ev, div);
        div.ondragenter = ()=>expandSubgroup(header, div);
        div.ondragleave = ()=>miniSubgroup(header, div);
        return div;
    }

    static toTaskComponent(object, parent) {
        const div = document.createElement("div");
        div.className = "task";
        div.objectMap = object;
        div.parentObjectMap = parent;
        div.draggable = true;
        const a = document.createElement("a");
        a.innerText = object.content;
        a.href = object.url;
        if (object.url === voidUrl) {
            a.classList.add("void");
        }
        a.target = "new";
        a.rel = "noopener";
        div.appendChild(a);
        div.ondragstart = ev=>dragstart(ev, div);
        div.ondragend = ev=>dragend(ev, div);
        return div;
    }

    static createComponent(object, parent) {
        if (Component.isGroup(object)) {
            return Component.toSubgroupComponent(object, parent);
        } else if (Component.isTask(object)) {
            return Component.toTaskComponent(object, parent);
        }
    }

    static isGroup(object){
        return (object.children !== undefined) && (object.name !== undefined);
    }

    static isTask(object) {
        return (object.content !== undefined) && (object.url !== undefined);
    }

    static groupToSubgroup(element) {
        element.classList.add("subgroup");
        element.style.width = "0px";
        element.style.height = "0px";
        const header = createSubgroupHeader(element.children[0].innerText);
        element.children[0].replaceWith(header);
        const container = element.children[1];
        container.className = "children-container";
        container.style.display = "none";
        element.ondragenter = ()=>expandSubgroup(header, element);
        element.ondragleave = ()=>miniSubgroup(header, element);
    }

    static subgroupToGroup(element) {
        if (!element.classList.contains("group")) {
            element.classList.add("group");
        }
        element.classList.remove("subgroup");
        element.style.width = "150px";
        element.style.height = "80vh";
        const header = createGroupHeader(element.children[0].innerText);
        element.children[0].replaceWith(header);
        const container = element.children[1];
        container.className = "group-children-container";
        container.style.display = "block";
        element.onclick = undefined;
        element.ondragenter = undefined;
        element.ondragleave = undefined;
        element.ondragend = ev=>groupDragend(ev, element);
    }
}

function expandElement(header, div) {
    if (header.classList.contains("not-expanded")){
        expandSubgroup(header, div);
    } else if (header.classList.contains("expanded")) {
        miniSubgroup(header, div);
    }
}

function insertAfter(newNode, refNode) {
    return refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
}

// displat the data stored
window.onload = ()=>{
    LocalStorage.getItems(["data","defaultGroup"]).then(({data, defaultGroup})=>{
        console.log(data);
        globalContainer.parentElement.objectMap = data;
        const fragment = document.createDocumentFragment();
        data.forEach((element, index) => {
            const div = Component.toGroupComponent(element, data);
            if (index === defaultGroup.index) {
                div.classList.add("defaultGroup");
            }
            fragment.appendChild(div);
        });
        globalContainer.ondragover = ev=>{
            ev.preventDefault();
            ev.stopPropagation();
            const draggingElement = document.querySelector(".dragging");
            if (draggingElement.classList.contains("subgroup")) {
                Component.subgroupToGroup(draggingElement);
            }
            if (Component.isGroup(draggingElement.objectMap)) {
                const children = [...globalContainer.querySelectorAll(":scope>:not(.dragging)")];
                const afterElement = afterDraggingElement(ev.clientX, children, "x");
                return afterElement !== null? 
                    container.insertBefore(draggingElement, afterElement): 
                    container.appendChild(draggingElement);
            }
        };
        globalContainer.appendChild(fragment);
    });
};

// add group
document.getElementById("addGroup").addEventListener("click", async ()=>{
    const {data} = globalContainer.parentElement.objectMap;
    console.assert(deepEqualJson(data, await getItems("data").then(result=>result.data)));
    console.log(data);
    let title = window.prompt("Please enter the title of the group in the box.");
    if (title === null) return;
    if ("" === (title = title.trim()))
        return window.alert("The title will be empty. Please try with another input.");
    if (!data.map(val=>val.name).includes(title) ||
    window.confirm("You have created a group with the same name already. Are you sure you want to create another one?")) {
        const object = {
            name: title,
            children: []
        };
        data.push(object); 
        LocalStorage.save().then(()=>{
            document.getElementById("container").appendChild(Component.toGroupComponent(object, data));
        });
    }
});

function dragover(ev, container){
    ev.preventDefault();
    ev.stopPropagation();
    const draggingElement = document.querySelector(".dragging");
    // it is possible that the element or the parent of the element is above itself
    if ( (draggingElement !== container) 
    && !([...draggingElement.querySelectorAll("*")].includes(container)) ) {
        if (draggingElement.classList.contains("group")) {
            Component.groupToSubgroup(draggingElement);
        }
        const children = [...container.querySelectorAll(":scope>:not(.dragging)")];
        const afterElement = afterDraggingElement(ev.clientY, children);
        return afterElement !== null? 
            container.insertBefore(draggingElement, afterElement): 
            container.appendChild(draggingElement);
    }
}

function dragstart(ev, element) {
    ev.stopPropagation();
    console.log(getParentIndex(element));
    element.classList.add("dragging");
}

function dragend(ev, element) {
    ev.stopPropagation();
    element.classList.remove("dragging");
    const {parent, index} = getParentIndex(element);
    console.log(parent, index);
    const oldParent = element.parentObjectMap;
    const oldIndex = oldParent.indexOf(element.objectMap);
    const newParent = parent.parentElement.objectMap;
    if (newParent !== oldParent || index !== oldIndex) {
        oldParent.splice(oldIndex, 1);
        newParent.splice(index, 0, element.objectMap);
        element.parentObjectMap = newParent;
        LocalStorage.save();
    }
}

function groupDragend(ev, div){
    ev.stopPropagation();
    div.classList.remove("dragging");
    if (parent.id !== "container") {
        div.classList.remove("group");
    }
    const {parent, index} = getParentIndex(element);
    console.log(parent, index);
    const oldParent = element.parentObjectMap;
    oldParent.splice(oldParent.indexOf(element.objectMap), 1);
    element.parentObjectMap = parent.parentElement.objectMap;
    element.parentObjectMap.splice(index, 0, element.objectMap);
    LocalStorage.save();
}

function getParentIndex(element) {
    console.log(element);
    const parent = element.parentElement;
    return {parent:parent, index:[...parent.children].indexOf(element)};
}

function afterDraggingElement(pos, siblings, mode) {
    return siblings.reduce((accum, curr)=>{
        const offset = mode === "x"? 
            pos - x_pos(curr.getBoundingClientRect()): 
            pos - y_pos(curr.getBoundingClientRect());
        if (offset < 0 && offset > accum.offset) {
            return {offset: offset, afterElement: curr};
        } else {
            return accum;
        }
    }, {offset: Number.NEGATIVE_INFINITY, afterElement: null}).afterElement;
}

function x_pos(rect){
    return rect.left + (rect.width / 2);
}

function y_pos(rect){
    return rect.top + (rect.height / 2);
}

function expandSubgroup(header, div) {
    div.style.display = "block";
    header.classList.replace("not-expanded","expanded");
}

function miniSubgroup(header, div) {
    div.style.display = "none";
    header.classList.replace("expanded", "not-expanded");
}

function JsonDeepEqual(a, b) {
    if (a === b) return true;
    if ((typeof a) !== (typeof b)) return false;
    if (typeof a === "object") {
        // the type of an array is an object
        const aIsArray = Array.isArray(a), bIsArray = Array.isArray(b);
        if (aIsArray && bIsArray)
            return a.map((val, index)=>[val, b[index]]).some(([a, b])=>
                !deepEqual(a,b));
        if (aIsArray || bIsArray) return false;
        // null is an object but it is different from {} and we cannot apply Object.keys() to it
        if ((a === null) || (b === null)) return false;

        return Object.keys(a).map(val=>[a[val], b[val]]).some(([a,b])=>
            !deepEqual(a,b));
    }
    // Since Nan !== Nan
    if (typeof a === 'number' && isNaN(a) && isNaN(b)) {
        return true;
    }
    return false;
}

function createGroupHeader(name, parentElement) {
    const header = document.createElement("div");
    header.className = "group-header";
    const cross = createCross(parentElement);
    const text = document.createElement("h2");
    text.innerText = name;
    text.style.display = "inline";
    const [optionsbtn, content] = createDropDown(parentElement);
    header.onmouseover = ()=>{
        cross.style.display = "inline";
        optionsbtn.style.display = "inline";
    };
    header.onmouseout = ()=>{
        cross.style.display = "none";
        optionsbtn.style.display = "none";
    };
    header.appendChild(cross);
    header.appendChild(text);
    header.appendChild(optionsbtn);
    header.appendChild(content);
    return header;
}

function createSubgroupHeader(name, parentElement){
    const header = document.createElement("div");
    header.className = "subgroup-header not-expanded";
    const cross = createCross(parentElement);
    const [optionsbtn, content] = createDropDown(parentElement);
    header.onmouseover = ()=>{
        cross.style.display = "inline";
        optionsbtn.style.display = "inline";
    };
    header.onmouseout = ()=>{
        cross.style.display = "none";
        optionsbtn.style.display = "none";
    };
    header.onclick = ()=>expandElement(header, childrenContainer);
    header.appendChild(cross);
    header.appendChild(document.createTextNode(name));
    header.appendChild(optionsbtn);
    header.appendChild(content);
    return header;
}

function getDefaultGroupIndex() {
    const defaultGroup = document.getElementsByClassName("defaultGroup");
    if (defaultGroup.length === 1) {
        const defaultGroupElement = defaultGroup[0];
        return getParentIndex(defaultGroupElement).index;
    }
    return -1;
}

function createCross(element) {
    const cross = document.createElement("img");
    cross.src = "img/cross.png";
    cross.style.display = "none";
    cross.onclick = ()=>Remove(element);
    return cross;
}

function createDropDown(element) {
    const optionsbtn = document.createElement("img");
    optionsbtn.src = "img/optionsbtn.png";
    optionsbtn.style.display = "none";
    const content = createDropDownContent(element);
    optionsbtn.className = "not-expanded";
    optionsbtn.onclick = ()=>expandElement(optionsbtn, content);
    return [optionsbtn, content];
}

function createDropDownContent(element) {
    const content = document.createElement("div");
    content.style.display = "none";
    content.style.position = "absolute";
    // TODO: add buttons (div, onclick)
    return content;
}
