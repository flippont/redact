window.container = document.getElementById('container')
window.search = document.getElementById('search')
window.links = document.getElementById('links')
window.output = document.getElementById('text')
window.heading = document.getElementById('heading')

let data = []
let paths = []
let currentPath = []
let completed = [
    'sonnet'
]

fetch('https://flippont.github.io/test/src/data.json')
    .then((response) => response.json())
    .then((json) => {
        data = json;
    });

fetch('https://flippont.github.io/test/src/paths.json')
    .then((response) => response.json())
    .then((json) => {
        paths = json;
        init()
    });



let html = {
    'home' : {
        enter: [window.search, window.output],
        exit: [window.search, window.output],
        onenter: () => {
            currentPath = []
            window.output.innerHTML = '';
            window.search.onkeydown = (event) => {
                if(event.key == 'Enter') {
                    changePage('search')
                }
            }
            renderLists(paths)
        },
        onexit: () => {
            window.search.value = ''
        }
    },
    'search' : {
        enter: [window.search, window.output],
        exit: [window.search, window.output],
        onenter: () => {
            window.search.onkeydown = (event) => {
                if(event.key == 'Enter') {
                    changePage('search')
                }
            }
            findArticle(window.search.value)
        }
    },
    'article' : {
        onenter: () => {
            window.container.innerHTML = 'Loading...'
            fetch('https://flippont.github.io/test/src/pages/' + currentPath.join('/').toLowerCase() + '/' + currentPage + '.html')
            .then((response) => response.text())
            .then((text) => {
                window.container.innerHTML = text
                window.heading.innerHTML = currentPage
            })
        }
    },
    'list' : {
        enter: [window.search],
        exit: [window.search],
        onenter: () => {
            window.search.onkeydown = (event) => {
                if(event.key == 'Enter') {
                    changePage('search')
                }
            }
            window.container.innerHTML = 'Loading...'
            findArticle(' ')
        }
    },
    onexit: () => {
        window.search.value = ''
    }
}

let links = [
    {
        name: 'Home',
        function: changePage.bind(this, 'home')
    },
    {
        name: 'List',
        function: changePage.bind(this, 'list')
    }
]

function findArticle(term) {
    if(term.length < 1) return false
    let matches = 0;
    window.container.innerHTML = '';
    for(let i = 0; i < data.length; i++) {
        let container = data[i].title + data[i].excerpt;
        if(container.includes(term)) {
            matches += 1;
            window.container.appendChild(drawCard(data[i]))
        }
    }
    window.output.innerHTML = matches + ' matches found.'
}

let currentPage = ''

function arraysEqual (a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

function findPath (path, createdPath, subdivision, finalPath, type) {
    for (let i = 0; i < createdPath.length; i++) {
        if (path[subdivision] == createdPath[i].name) {
            if (type == 'location') {
                finalPath.push(i)
            } else if (type == 'name') {
                finalPath.push(createdPath[i].name)
            } else {
                finalPath.push(createdPath[i].subs)
            }
            if (createdPath[i].subs) {
                return findPath(path, createdPath[i].subs, (subdivision + 1), finalPath, type)
            }
        }
        if (finalPath.length == path.length) {
            return finalPath
        }
    }
}

function drawCard(data) {
    let articleItem = document.createElement('div')
    articleItem.innerHTML = `
    <h1>${data.title}</h1>
    <p style='color: gray'>${data.author}</p>
    ${data.excerpt}
    <div class='colour' style='background-color: ${
        paths[findPath([data.path[0]], paths, 0, [], 'location')[0]].colour
    }'></div>
    `;
    articleItem.className = 'article'
    articleItem.tabIndex = '0'
    articleItem.onkeyup = (event) => {
        if(event.key == 'Enter') {
            currentPage = data.title
            currentPath = findPath(data.path, paths, 0, [], 'name')
            console.log(currentPath)
            changePage('article')
        }
    }
    articleItem.onclick = () => {
        currentPage = data.title
        currentPath = findPath(data.path, paths, 0, [], 'name')
        changePage('article')
    }
    return articleItem
}
function calculatePercentage(listName) {
    let totalNumber = 0;
    let itemNumber = 0;
    for (const item of data) {
        if (!listName.includes(",") && item.path[0] == listName) {
            if (completed.includes(item.title)) {
              itemNumber += 1;
            }
            totalNumber += 1;
          }        
          if (item.path == listName) {
            if (completed.includes(item.title)) {
                itemNumber += 1;
            }
            totalNumber += 1;
        }
    }
    if (totalNumber == 0) {
        totalNumber = 1
    }
    return Math.floor((itemNumber / totalNumber) * 100)
}

function renderLists (path) {
    window.output.innerHTML = 
    `<a onclick='changePage("home")'>Home</a>`
    let list = [];
    for(let i=0; i < currentPath.length; i++) {
        let between = document.createElement('span');
        between.innerHTML = ' / ';
        window.output.appendChild(between);

        let element = document.createElement('a')
        element.innerHTML = currentPath[i]
        list.push(currentPath[i])
        let calc = findPath(list, paths, 0, [], 'subs');
        let calcName = findPath(list, paths, 0, [], 'name');

        element.onclick = () => {
            currentPath = calcName;
            renderLists(calc[calc.length-1]);
        }
        
        window.output.appendChild(element)
    }

    window.container.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        if (arraysEqual(data[i].path, currentPath)) {
            window.container.appendChild(drawCard(data[i]))
        }
    }

    if(!path) return true

    for (let i = 0; i < path.length; i++) {
       
        let nestFile = document.createElement('div');
        nestFile.className = 'list'
        nestFile.tabIndex = '0'
        nestFile.innerHTML = path[i].name; 

        nestFile.onkeyup = (event) => {
            if(event.key == 'Enter') {
                currentPath.push(path[i].name)
                renderLists(path[i].subs)
            }
        }
        nestFile.onclick = () => {
            currentPath.push(path[i].name)
            renderLists(path[i].subs)
        }

        let colour = document.createElement('div');
        colour.className = 'colour'
        colour.style.width = calculatePercentage(currentPath.join(",") + ((currentPath.length > 0) ? "," : "") + path[i].name) * 1.3 + 10 + 'pt'
        colour.style.background = 
        (path[i].colour) ? path[i].colour :
        paths[findPath(currentPath, paths, 0, [], 'location')[0]].colour
        nestFile.appendChild(colour)
        window.container.appendChild(nestFile)
    }
}

let screen = 'home'
let previousScreen = screen

function changePage (newScene) {
    if (html[screen] && html[screen].exit) {
        for (let element of html[screen].exit) {
            element.classList.add('hidden')
        }
    }
    if (html[newScene] && html[newScene].enter) {
        for (let element of html[newScene].enter) {
            element.classList.remove('hidden')
        }
    }
    if (html[newScene] && html[newScene].onenter) {
        html[newScene].onenter()
    }
    if (html[screen] && html[screen].onexit) {
        html[screen].onexit()
    }

    previousScreen = screen
    screen = newScene
    populateLinks()
}

function populateLinks () {
    window.links.innerHTML = '';
    for(let i = 0; i < links.length; i++) {
        let linkItem = document.createElement('div');
        linkItem.className = (screen == links[i].name.toLowerCase()) ? 'list active' : 'list'
        linkItem.innerHTML = links[i].name;
        linkItem.tabIndex = '0';
        linkItem.onkeyup = (event) => {
            if(event.key == 'Enter') {
                links[i].function()
            }
        }
        linkItem.onclick = () => {
            links[i].function()
        }
        window.links.appendChild(linkItem)
    }
}



init = () => {
    changePage('home')
}
