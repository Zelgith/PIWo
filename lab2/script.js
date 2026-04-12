"use strict";

//dane aplikacji
let lists = [
    { id: "zadania-list", name: "Zadania", isFolded: false, tasks: [] }
];

let lastDeletedTask = null;
let taskToDeleteInfo = null;

//elementy dom
const newListInput = document.getElementById("newListInput");
const addListBtn = document.getElementById("addListBtn");
const taskInput = document.getElementById("taskInput");
const listSelect = document.getElementById("listSelect");
const addTaskBtn = document.getElementById("addTaskBtn");
const searchInput = document.getElementById("searchInput");
const caseSensitiveCheckbox = document.getElementById("caseSensitive");
const listsContainer = document.getElementById("listsContainer");
const deleteModal = document.getElementById("deleteModal");
const modalText = document.getElementById("modalText");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

//funkcja renderująca html
function render() {
    listsContainer.innerHTML = "";
    listSelect.innerHTML = "";

    const query = searchInput.value;
    const isCaseSensitive = caseSensitiveCheckbox.checked;

    for (let i = 0; i < lists.length; i = i + 1) {
        const list = lists[i];

        //wybór listy w select
        const option = document.createElement("option");
        option.value = list.id;
        option.textContent = list.name;
        listSelect.appendChild(option);

        //główny div listy
        const listDiv = document.createElement("div");
        listDiv.className = "list-group";

        //nagłówek listy
        const header = document.createElement("div");
        header.className = "list-header";

        const nameSpan = document.createElement("span");
        nameSpan.className = "list-name";
        nameSpan.textContent = list.name + " (" + list.tasks.length + ")";
        nameSpan.onclick = function () {
            list.isFolded = !list.isFolded;
            render();
        };
        header.appendChild(nameSpan);

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "list-actions";

        //przycisk zwijania
        const foldBtn = document.createElement("button");
        foldBtn.className = "btn";
        foldBtn.textContent = list.isFolded ? "▼" : "▲";
        foldBtn.onclick = function () {
            list.isFolded = !list.isFolded;
            render();
        };
        actionsDiv.appendChild(foldBtn);

        //usuwanie listy
        if (lists.length > 1) {
            const delListBtn = document.createElement("button");
            delListBtn.className = "btn btn-danger";
            delListBtn.textContent = "Usuń listę";
            delListBtn.onclick = function () {
                lists.splice(i, 1);
                render();
            };
            actionsDiv.appendChild(delListBtn);
        }

        header.appendChild(actionsDiv);
        listDiv.appendChild(header);

        //lista zadań
        const ul = document.createElement("ul");
        ul.className = "list-content";
        if (list.isFolded === true) {
            ul.classList.add("hidden");
        }

        for (let j = 0; j < list.tasks.length; j = j + 1) {
            const task = list.tasks[j];

            //wyszukiwanie
            let matchesSearch = true;
            if (query !== "") {
                if (isCaseSensitive === true) {
                    if (task.text.indexOf(query) === -1) {
                        matchesSearch = false;
                    }
                } else {
                    if (task.text.toLowerCase().indexOf(query.toLowerCase()) === -1) {
                        matchesSearch = false;
                    }
                }
            }

            if (matchesSearch === true) {
                //element zadania
                const li = document.createElement("li");
                li.className = "task-item";
                if (task.done === true) {
                    li.classList.add("task-done");
                }

                //oznaczanie jako zrobione
                li.onclick = function (event) {
                    if (event.target.tagName !== "BUTTON") {
                        task.done = !task.done;
                        if (task.done === true) {
                            task.date = new Date().toLocaleString();
                        } else {
                            task.date = "";
                        }
                        render();
                    }
                };

                const span = document.createElement("span");
                span.className = "task-text";
                span.textContent = task.text;
                li.appendChild(span);

                //data wykonania
                if (task.done === true && task.date !== "") {
                    const dateSpan = document.createElement("span");
                    dateSpan.className = "completion-date";
                    dateSpan.textContent = task.date;
                    li.appendChild(dateSpan);
                }

                //przycisk usuwania zadania
                const delBtn = document.createElement("button");
                delBtn.className = "btn btn-danger";
                delBtn.textContent = "X";
                delBtn.onclick = function (event) {
                    event.stopPropagation();
                    showModal(list.id, task.id);
                };
                li.appendChild(delBtn);

                ul.appendChild(li);
            }
        }

        listDiv.appendChild(ul);
        listsContainer.appendChild(listDiv);
    }
}

//pokazywanie modala
function showModal(listId, taskId) {
    let foundTask = null;
    for (let i = 0; i < lists.length; i = i + 1) {
        if (lists[i].id === listId) {
            for (let j = 0; j < lists[i].tasks.length; j = j + 1) {
                if (lists[i].tasks[j].id === taskId) {
                    foundTask = lists[i].tasks[j];
                }
            }
        }
    }

    if (foundTask !== null) {
        taskToDeleteInfo = { listId: listId, taskId: taskId };
        modalText.textContent = "Czy na pewno chcesz usunąć zadanie o treści: " + foundTask.text;
        deleteModal.classList.remove("hidden");
    }
}

//dodawanie listy
function addList() {
    const name = newListInput.value.trim();
    if (name !== "") {
        const newList = {
            id: "list-" + Date.now(),
            name: name,
            isFolded: false,
            tasks: []
        };
        lists.push(newList);
        newListInput.value = "";
        render();
    }
}

//dodawanie zadania
function addTask() {
    const text = taskInput.value.trim();
    if (text !== "") {
        const targetListId = listSelect.value;
        const newTask = {
            id: "task-" + Date.now(),
            text: text,
            done: false,
            date: ""
        };

        for (let i = 0; i < lists.length; i = i + 1) {
            if (lists[i].id === targetListId) {
                lists[i].tasks.push(newTask);
                break;
            }
        }
        taskInput.value = "";
        render();
    }
}

//potwierdzenie usunięcia
function confirmDelete() {
    if (taskToDeleteInfo !== null) {
        const listId = taskToDeleteInfo.listId;
        const taskId = taskToDeleteInfo.taskId;

        for (let i = 0; i < lists.length; i = i + 1) {
            if (lists[i].id === listId) {
                for (let j = 0; j < lists[i].tasks.length; j = j + 1) {
                    if (lists[i].tasks[j].id === taskId) {
                        lastDeletedTask = {
                            task: lists[i].tasks[j],
                            listId: listId,
                            index: j
                        };
                        lists[i].tasks.splice(j, 1);
                        break;
                    }
                }
                break;
            }
        }
        taskToDeleteInfo = null;
        deleteModal.classList.add("hidden");
        render();
    }
}

//cofanie usunięcia
function undo() {
    if (lastDeletedTask !== null) {
        const listId = lastDeletedTask.listId;
        const task = lastDeletedTask.task;
        const index = lastDeletedTask.index;

        for (let i = 0; i < lists.length; i = i + 1) {
            if (lists[i].id === listId) {
                lists[i].tasks.splice(index, 0, task);
                lastDeletedTask = null;
                render();
                break;
            }
        }
    }
}

//obsługa kliknięć
addListBtn.onclick = addList;
addTaskBtn.onclick = addTask;
confirmDeleteBtn.onclick = confirmDelete;
cancelDeleteBtn.onclick = function () {
    deleteModal.classList.add("hidden");
    taskToDeleteInfo = null;
};

//obsługa wyszukiwania
searchInput.oninput = render;
caseSensitiveCheckbox.onchange = render;

//obsługa klawiatury
window.onkeydown = function (event) {
    if (event.ctrlKey === true && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        undo();
    }
};

//start aplikacji
render();
