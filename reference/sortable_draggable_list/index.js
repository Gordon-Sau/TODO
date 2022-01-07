[...document.querySelectorAll(".element,.sub-container")].forEach(element=>{
    element.addEventListener("dragstart", (ev)=>{
        // the dragstart event of the parent would not get triggered
        ev.stopPropagation();
        console.log(getParentIndex(element));
        element.classList.add("dragging");
    });

    element.addEventListener("dragend", (ev)=>{
        ev.stopPropagation();
        console.log(getParentIndex(element));
        element.classList.remove("dragging");
    });
});

[...document.querySelectorAll(".container,.sub-container")].forEach(container=>{
    container.addEventListener("dragover", ev=>{
        ev.preventDefault();
        ev.stopPropagation();
        const draggingElement = document.querySelector(".dragging");
        // it is possible that the element or the parent of the element is above itself
        if ( (draggingElement !== container) 
        && !([...draggingElement.querySelectorAll("*")].includes(container)) ) {
            const children = [...container.querySelectorAll(":scope>:not(.dragging)")];
            const afterElement = afterDraggingElement(ev.clientY,children);
            return afterElement !== null? 
                container.insertBefore(draggingElement, afterElement): 
                container.appendChild(draggingElement);
        }
    });
});

function getParentIndex(element) {
    const parent = element.parentElement;
    return {parent:parent, index:[...parent.children].indexOf(element)};
}

function afterDraggingElement(pos, siblings) {
    return siblings.reduce((accum, curr)=>{
        const offset = pos - curr.getBoundingClientRect().top;
        if (offset < 0 && offset > accum.offset) {
            return {offset: offset, afterElement: curr};
        } else {
            return accum;
        }
    }, {offset: Number.NEGATIVE_INFINITY, afterElement: null}).afterElement;
}
