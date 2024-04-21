window.container = document.getElementById('container')
window.search = document.getElementById('search')
window.links = document.getElementById('links')
window.output = document.getElementById('text')
window.heading = document.getElementById('heading')

let loc = new URL(location.href)
let params = loc.searchParams

console.log(loc, params)
let data = []
let paths = []
let currentPath = []
let completed = []
let currentPage = ''

if(localStorage.getItem('completed')) {
    completed = JSON.parse(localStorage.getItem('completed'))
}

fetch('https://flippont.github.io/test/src/data.json')
    .then((response) => response.json())
    .then((json) => {
        data = json;
        fetch('https://flippont.github.io/test/src/paths.json')
            .then((response) => response.json())
            .then((json) => {
                paths = json;
                init()
            });
    });

let html = {
    'home': {
        enter: [window.search, window.output],
        exit: [window.search, window.output],
        onenter: () => {
            window.heading.innerHTML = 'Untitled Notes App'
            window.output.innerHTML = '';
            window.search.onkeydown = (event) => {
                if (event.key == 'Enter') {
                    changePage('search')
                }
            }
            renderLists(paths)
        }
    },
    'search': {
        enter: [window.search, window.output],
        exit: [window.search, window.output],
        onenter: () => {
            window.heading.innerHTML = 'Untitled Notes App'
            window.search.onkeydown = (event) => {
                if (event.key == 'Enter') {
                    changePage('search')
                }
            }
            findArticle(window.search.value)
        }
    },
    'article': {
        onenter: () => {
            window.container.innerHTML = 'Loading...'
            fetch('https://flippont.github.io/test/src/pages/' + currentPath.join('/').toLowerCase() + '/' + currentPage.url + '.html')
                .then((response) => response.text())
                .then((text) => {
                    window.container.innerHTML = text
                    window.heading.innerHTML = currentPage.title
                    if(!completed.includes(currentPage.title)) {
                        completed.push(currentPage.title)
                        localStorage.setItem('completed', JSON.stringify(completed))
                    }
                })
        }
    },
    'list': {
        onenter: () => {
            window.search.onkeydown = (event) => {
                if (event.key == 'Enter') {
                    changePage('search')
                }
            }
            window.container.innerHTML = 'Loading...'
            findArticle(' ')
        }
    },
    'saved': {
        enter: [],
        exit: [],
        onenter: () => {
            
        }
    },
    'settings': {
        enter: [],
        exit: [],
        onenter: () => {

        }   
    }
}

let state = {
    current: '',
    page: 'home'
};

let links = [
    {
        name: 'Home',
        function: () => {currentPath = []; changePage('home')}
    },
    {
        name: 'Saved',
        function: changePage.bind(this, 'saved')
    },
    {
        name: 'List',
        function: changePage.bind(this, 'list')
    },
    {
        name: 'Search',
        function: changePage.bind(this, 'search')
    },
    {
        name: 'Settings',
        function: changePage.bind(this, 'settings')
    }
]

function getResults(element) {
    let amountCorrect = 0;
    let container = document.getElementsByClassName('quiz')[element];
    let total = Array.from(container.getElementsByClassName('questions'))
    document.getElementsByClassName('submit')[element].disabled = true
    for (let i = 0; i < total.length; i++) {
        var radiosName = document.getElementsByName('answer-' + i);
        for (let j = 0; j < radiosName.length; j++) {
            let radiosValue = radiosName[j];
            radiosValue.disabled = true
            if (radiosValue.checked) {
                document.getElementById('question-' + i).style.color = '#fff';
                if (radiosValue.value == 'correct') {
                    amountCorrect++;
                    document.getElementById('question-' + i).style.background = '#90be6d';
                } else {
                    document.getElementById('question-' + i).style.background = '#ef476f';
                }
            } else {
                if(radiosValue.value == 'correct') {
                    radiosValue.style.boxShadow = '0pt 0pt 0pt 10pt #1b9aaa inset'
                }
            }
        }
    }

    document.getElementById('results').innerHTML =
        'Score: ' + amountCorrect + '/' + total.length;
    
}
function reset(element) {
    let container = document.getElementsByClassName('quiz')[element];
    let total = Array.from(container.getElementsByClassName('questions'))
    document.getElementsByClassName('submit')[element].disabled = false
    
    for (let i = 0; i < total.length; i++) {
        var radiosName = document.getElementsByName('answer-' + i);
        for (let j = 0; j < radiosName.length; j++) {
            radiosName[j].checked = false
            radiosName[j].disabled = false
            radiosName[j].style.boxShadow = 'none'
            document.getElementById('question-' + i).style.background = getComputedStyle(document.documentElement).getPropertyValue('--borders');
            document.getElementById('question-' + i).style.color = '#000';
        }
    }
}

function findArticle(term) {
    let matches = 0;
    window.container.innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        let container = data[i].title + data[i].excerpt + data[i].path[0];
        if (container.toLowerCase().includes(term.toLowerCase())) {
            matches += 1;
            window.container.appendChild(drawCard(data[i]))
        }
    }
    window.output.innerHTML = matches + ' matches found.'
}

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function findPath(path, createdPath, subdivision, finalPath, type) {
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
    <h2>${data.title}</h2>
    ${(data.author) ? '<p style="color: gray">' + data.author + '</p>' : ''}
    ${data.excerpt}
    <div class='colour' style='background-color: ${paths[findPath([data.path[0]], paths, 0, [], 'location')[0]].colour
        }'></div>
    `;
    articleItem.className = 'article'
    articleItem.tabIndex = '0'
    articleItem.onkeyup = (event) => {
        if (event.key == 'Enter') {
            currentPage = { url: data.url, title: data.title }
            currentPath = findPath(data.path, paths, 0, [], 'name')
            console.log(currentPath)
            changePage('article')
        }
    }
    articleItem.onclick = () => {
        currentPage = { url: data.url, title: data.title }
        currentPath = findPath(data.path, paths, 0, [], 'name')
        changePage('article')
    }
    return articleItem
}
function calculatePercentage(listName) {
    let totalNumber = 0;
    let itemNumber = 0;
    for (const item of data) {
        if (!listName.includes(',') && item.path[0] == listName) {
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

function renderLists(path, popstate = false) {
    if(!popstate) {
        state.path = currentPath;
        window.history.pushState(state, null, 'https://flippont.github.io/test/?s=home&p=' + currentPath.join(','))
    }

    window.output.innerHTML =
        `<a onclick="changePage('home')">Home</a>`
    let list = [];
    for (let i = 0; i < currentPath.length; i++) {
        let between = document.createElement('span');
        between.innerHTML = ' / ';
        window.output.appendChild(between);

        let element = document.createElement('a')
        element.innerHTML = currentPath[i]
        list.push(currentPath[i])
        let calc = findPath(list, paths, 0, [], 'subs');
        let calcName = findPath(list, paths, 0, [], 'name');
        element.tabIndex = '0'
        element.onclick = () => {
            currentPath = calcName;
            renderLists(calc[calc.length - 1]);
        }
        element.onkeydown = (event) => {
            if (event.key == 'Enter') {
                currentPath = calcName;
                renderLists(calc[calc.length - 1]);
            }
        }

        window.output.appendChild(element)
    }

    window.container.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        if (arraysEqual(data[i].path, currentPath)) {
            window.container.appendChild(drawCard(data[i]))
        }
    }

    if (!path) return true

    for (let i = 0; i < path.length; i++) {

        let nestFile = document.createElement('div');
        nestFile.className = 'list'
        nestFile.tabIndex = '0'
        nestFile.innerHTML = path[i].name;

        nestFile.onkeyup = (event) => {
            if (event.key == 'Enter') {
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
        colour.style.width = calculatePercentage(currentPath.join(',') + ((currentPath.length > 0) ? ',' : '') + path[i].name) * 1.3 + 10 + 'pt'
        colour.style.background =
            (path[i].colour) ? path[i].colour :
                paths[findPath(currentPath, paths, 0, [], 'location')[0]].colour
        nestFile.appendChild(colour)
        window.container.appendChild(nestFile)
    }
}

let screen = 'home'
let previousScreen = screen

function changePage(newScene, popstate = false) {
    if(!popstate) {
        state.page = newScene;
        if(newScene == 'article') {
            state.current = currentPage
        }
        window.history.pushState(state, null, 'https://flippont.github.io/test/?s=' + newScene.toLowerCase() 
         + ((newScene == 'article') ? '&n=' + currentPage : ''));
    }
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

function populateLinks() {
    window.links.innerHTML = '';
    for (let i = 0; i < links.length; i++) {
        let linkItem = document.createElement('div');
        linkItem.className = (screen == links[i].name.toLowerCase()) ? 'list active' : 'list'
        linkItem.innerHTML = links[i].name;
        linkItem.tabIndex = '0';
        linkItem.onkeyup = (event) => {
            if (event.key == 'Enter') {
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
    currentPath = []
    window.history.replaceState(state, null, loc);
    if(params.get('s')) {
        changePage(params.get('s'), true)
    } else {
        changePage('home', true)
    }
    if(params.get('n')) {
        currentPage = params.get('n')
    }
    if(params.get('p')) {
        renderLists(params.get('p').split(','))
    }
}

window.onpopstate = (event) => {
    if (event.state) { state = event.state; }
    if (state.page == 'article') {
        currentPage = state.current
    }
    currentPath = state.path
    changePage(state.page, true)
    if(state.page == 'home' && currentPath != []) {
        renderLists(state.path, true)
    }
}

let scrolling = false
document.onscroll = async function(ev) {
    if ((window.innerHeight + document.documentElement.scrollTop) >= document.body.offsetHeight - 1000) {
        let offset = output.childElementCount
        if (scrolling || offset < 50 || offset % 50 !== 0) return
        scrolling = true
        
        scrolling = false
    }
};