
window.container = document.getElementById('container')

let data = []
let paths = []
let currentPath = []
let completed = []
let saved = []
let currentPage = ''

if (localStorage.getItem('completed')) {
    completed = JSON.parse(localStorage.getItem('completed'))
}
if (localStorage.getItem('saved')) {
    saved = JSON.parse(localStorage.getItem('saved'))
}

let headings = [];

let filterCondition = {
    sortby: 'alphabetic',
    subjects: 'all',
    level: 'all',
    filterread: false,
    filtertest: false,
    reverse: false
}

let tag_names = {
    h1: 1,
    h2: 1,
    h3: 1,
    h4: 1,
    h5: 1,
    h6: 1
};

function walk(root) {
    if (root.nodeType === 1 && root.nodeName !== 'script') {
        if (tag_names.hasOwnProperty(root.nodeName.toLowerCase())) {
            headings.push({ heading: root, content: root.nextElementSibling });
        } else {
            for (let i = 0; i < root.childNodes.length; i++) {
                walk(root.childNodes[i]);
            }
        }
    }
}

fetch('https://flippont.github.io/redact/src/data.json')
    .then((response) => response.json())
    .then((json) => {
        data = json;
        fetch('https://flippont.github.io/redact/src/paths.json')
            .then((response) => response.json())
            .then((json) => {
                paths = json;
                init()
            });
    });

let html = {
    'home': {
        url: 'home',
        onenter: () => {
            window.search.onkeydown = (event) => {
                if (event.key == 'Enter') {
                    changePage('search')
                }
            }
            let url = new URL(location);
            if (url.searchParams.get('p')) {
                let path = url.searchParams.get('p').split(',');
                currentPath = url.searchParams.get('p').split(',');
                let objects = findPath(path, paths, path.length - 1, [], 'subs');
                if (objects) {
                    renderLists(objects[0], true)
                } else {
                    objects = []
                    renderLists(objects[0], true)
                }
            } else {
                renderLists(paths, true)
            }
            if (saved.length > 0) {
                for (let i = 0; i < saved.length; i++) {
                    for (let dat of data) {
                        if (dat.title == saved[i]) {
                            let small = document.createElement('div')
                            small.className = 'savedList'
                            small.style.borderLeft = '10px solid ' + paths[findPath(dat.path, paths, 0, [], 'location')[0]].colour
                            small.innerHTML = saved[i]
                            small.onclick = () => {
                                if(dat.url.includes('http')) {
                                    window.open(dat.url);
                                } else {
                                    currentPage = { url: dat.url, title: dat.title }
                                    currentPath = dat.path
                                    changePage('article')
                                }
                            }
                            document.getElementById('saved').appendChild(small)
                        }
                    }
                }
            } else {
                document.getElementById('saved').innerHTML = 'No articles saved :('
            }

        }
    },
    'search': {
        url: 'search',
        onenter: () => {
            let url = new URL(location);
            url.searchParams.delete('p')
            document.getElementById('sortby').value = filterCondition.sortby
            document.getElementById('subjects').value = filterCondition.subjects
            document.getElementById('level').value = filterCondition.level
            document.getElementById('filterread').innerHTML = 'Articles you\'ve read ' + ((filterCondition.filterread) ? '✓' : '')
            document.getElementById('filtertest').innerHTML = 'Articles without tests ' + ((filterCondition.filtertest) ? '✓' : '')
            document.getElementById('reverse').innerHTML = 'Sort order: ' + ((filterCondition.reverse) ? '▲' : '▼')

            for(let i=0; i<paths.length; i++) {
                document.getElementById('subjects').innerHTML += `<option value="${paths[i].name}">${paths[i].name}</option>`
            }
            document.getElementById('sortby').onchange = () => {
                filterCondition.sortby = document.getElementById('sortby').value
                findArticle(window.search.value)
            }
            document.getElementById('subjects').onchange = () => {
                filterCondition.subjects = document.getElementById('subjects').value
                findArticle(window.search.value)
            }
            document.getElementById('level').onchange = () => {
                filterCondition.level = document.getElementById('level').value
                findArticle(window.search.value)
            }
            document.getElementById('filterread').onclick = () => {
                filterCondition.filterread = !filterCondition.filterread
                document.getElementById('filterread').innerHTML = 'Articles you\'ve read ' + ((filterCondition.filterread) ? '✓' : '')
                findArticle(window.search.value)
            }
            document.getElementById('filtertest').onclick = () => {
                filterCondition.filtertest = !filterCondition.filtertest
                document.getElementById('filtertest').innerHTML = 'Articles without tests ' + ((filterCondition.filtertest) ? '✓' : '')
                findArticle(window.search.value)
            }
            document.getElementById('reverse').onclick = () => {
                filterCondition.reverse = !filterCondition.reverse
                document.getElementById('reverse').innerHTML = 'Sort order: ' + ((filterCondition.reverse) ? '▲' : '▼')
                findArticle(window.search.value)
            }
            document.getElementById('reset').onclick = () => {
                filterCondition.sortby = 'alphabetic';
                document.getElementById('sortby').value = 'alphabetic'
                filterCondition.subjects = 'all';
                document.getElementById('subjects').value = 'all'
                filterCondition.level = 'all';
                document.getElementById('level').value = 'all'
                filterCondition.filterread = false;
                document.getElementById('filterread').innerHTML = 'Articles you\'ve read ' + ((filterCondition.filterread) ? '✓' : '')
                filterCondition.filtertest = false;
                document.getElementById('filtertest').innerHTML = 'Articles without tests ' + ((filterCondition.filtertest) ? '✓' : '')
                filterCondition.reverse = false;
                document.getElementById('reverse').innerHTML = 'Sort order: ' + ((filterCondition.reverse) ? '▲' : '▼')
                findArticle(window.search.value)
            }
            window.search.onkeydown = (event) => {
                if (event.key == 'Enter') {
                    changePage('search')
                }
            }
            findArticle(window.search.value)
        }
    },
    'test': {
        url: 'test',
        onenter: () => {
            let url = new URL(location);
            if (url.searchParams.get('p')) {
                currentPath = url.searchParams.get('p').split(',')
            }
            fetch('https://flippont.github.io/redact/src/quiz/' + currentPath.join('/').toLowerCase() + '/' + currentPage.url + '.html')
                .then((response) => response.text())
                .then((text) => {
                    document.getElementById('test').innerHTML = text
                    let total = Array.from(container.getElementsByClassName('questions'))
                    for (let i = 0; i < total.length; i++) {
                        var radiosName = document.getElementsByName('answer-' + i);
                        for (let j = 0; j < radiosName.length; j++) {
                            radiosName[j].onclick = () => {
                                updateProgress(i, total.length)
                            }
                        }
                    }
                    updateProgress(-1, total.length)
                })
                .catch((error) => {
                    console.log(error)
                })
        }
    },
    'article': {
        url: 'article',
        onenter: () => {
            let url = new URL(location);
            if (url.searchParams.get('p')) {
                currentPath = url.searchParams.get('p').split(',')
            }
            fetch('https://flippont.github.io/redact/src/pages/' + currentPath.join('/').toLowerCase() + '/' + currentPage.url + '.html')
                .then((response) => response.text())
                .then((text) => {
                    document.getElementById('article').innerHTML = text
                    if (!completed.includes(currentPage.title)) {
                        completed.push(currentPage.title)
                        localStorage.setItem('completed', JSON.stringify(completed))
                    }
                    window.search.onkeydown = (event) => {
                        if (event.key == 'Enter') {
                            changePage('search')
                        }
                    }
                    document.body.style.backgroundImage = 'linear-gradient(#e66465, #9198e5);'
                    headings = []
                    walk(document.getElementById('article'));
                    document.getElementById('article').innerHTML =
                        `
            <svg height="25" width="23" class="star" data-rating="1" id='star' style="fill:${((saved.includes(currentPage.title)) ? '#e9ba26' : '#ccc')}" onclick="saveArticle(this, '${currentPage.title}')">
                <path d="M9.5 14.25l-5.584 2.936 1.066-6.218L.465 6.564l6.243-.907L9.5 0l2.792 5.657 6.243.907-4.517 4.404 1.066 6.218" />
            </svg>
            <h1 class="title"><i>${currentPage.title}</h1></i><br>
            `
                    for (let dat of data) {
                        if (dat.title == currentPage.title) {
                            document.getElementById('excerpt').innerHTML = dat.excerpt
                            break;
                        }
                    }

                    if (headings.length > 1) {
                        for (let i = 0; i < headings.length; i++) {
                            let box = document.createElement('div')
                            box.className = 'box'
                            let boxHead = document.createElement('div')
                            boxHead.className = 'boxTop'
                            boxHead.innerHTML = '<h2 id=' + headings[i].heading.innerHTML.replace(/\s/g, '-').toLowerCase() + '>' + headings[i].heading.innerHTML + '</h2>';
                            let boxBody = document.createElement('div')
                            boxBody.className = 'boxBottom'
                            boxBody.innerHTML = headings[i].content.innerHTML;
                            box.appendChild(boxHead);
                            box.appendChild(boxBody);
                            document.getElementById('article').appendChild(box)

                            let header = document.createElement('button')
                            header.className = 'contentsButton'
                            header.innerHTML = headings[i].heading.innerHTML.replace(':', '');
                            header.onclick = (() => { 
                                window.scrollTo(0, document.getElementById(headings[i].heading.innerHTML.replace(/\s/g, '-').toLowerCase()).offsetTop - document.getElementsByClassName('header')[0].offsetHeight)
                            })
                            document.getElementById('contents').appendChild(header)
                        }
                    } else {
                        let box = document.createElement('div')
                        box.className = 'box'
                        box.style.padding = '20px'
                        box.style.paddingTop = '5px'
                        let boxBody = document.createElement('div')
                        boxBody.className = 'boxBottom'
                        boxBody.innerHTML = text;
                        box.appendChild(boxBody);
                        document.getElementById('article').appendChild(box)
                        document.getElementById('contentscont').hidden = 'true'
                    }
                    fetch('https://flippont.github.io/redact/src/quiz/' + currentPath.join('/').toLowerCase() + '/' + currentPage.url + '.html')
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Not 2xx response", { cause: response });
                            } else {
                                response.text()
                            }
                        })
                        .then((text) => {
                            let button = document.createElement('button');
                            button.innerHTML = '<h2>Take Test</h2>'
                            button.className = 'testBtn'
                            button.onclick = (() => {
                                changePage('test')
                            })
                            document.getElementById('extras').appendChild(button)
                        })
                        .catch((error) => {
                            console.log(error)
                        })

                })
        }
    },
}

let checkArray = [-1]
function updateProgress(element, total) {
    document.getElementById('progress').innerHTML = ''
    if(!checkArray.includes(element)) {
        checkArray.push(element)
    }
    let progress = document.createElement('div');
    progress.className = 'progress'
    progress.style.boxShadow = (280 * ((checkArray.length - 1) / total)) + 'px 0px #ccc inset'
    document.getElementById('progress').appendChild(progress)
}
function saveArticle(starElement, save) {
    if (!saved.includes(save)) {
        starElement.style.fill = '#e9ba26';
        saved.push(save)
    } else {
        starElement.style.fill = '#ccc';
        saved.splice(saved.indexOf(save), 1)
    }
    localStorage.setItem('saved', JSON.stringify(saved))
}
let state = {
    path: [],
    page: 'home',
    current: ''
};
function resetURL() {
    currentPage = []
    currentPath = []
    const url = new URL(location);
    if (url.searchParams.get('l')) {
        url.searchParams.delete('l')
    }
    if (url.searchParams.get('p')) {
        url.searchParams.delete('p')
    }
    if (url.searchParams.get('q')) {
        url.searchParams.delete('q')
    }
    if (url.searchParams.get('n')) {
        url.searchParams.delete('n')
    }
    history.replaceState({}, null, url);
}

function getResults() {
    let amountCorrect = 0;
    let container = document.getElementById('test');
    let total = Array.from(container.getElementsByClassName('questions'))
    document.getElementsByClassName('submit')[0].disabled = true
    for (let i = 0; i < total.length; i++) {
        var radiosName = document.getElementsByName('answer-' + i);
        for (let j = 0; j < radiosName.length; j++) {
            let radiosValue = radiosName[j];
            radiosValue.disabled = true
            if (radiosValue.checked) {
                document.getElementById('question-' + i).style.color = '#fff';
                if (radiosValue.value == 'correct') {
                    amountCorrect++;
                    document.getElementById('question-' + i).style.background = '#90be6d6a';
                } else {
                    document.getElementById('question-' + i).style.background = '#ef476f6a';
                }
            } else {
                if (radiosValue.value == 'correct') {
                    radiosValue.style.boxShadow = '0pt 0pt 0pt 10pt #1b9aaa inset'
                }
            }
        }
    }

    document.getElementById('results').innerHTML =
        'Score: ' + amountCorrect + '/' + total.length;

}
function reset() {
    let container = document.getElementById('test');
    let total = Array.from(container.getElementsByClassName('questions'))
    document.getElementsByClassName('submit')[0].disabled = false
    checkArray = [-1]
    updateProgress(-1, total.length)
    for (let i = 0; i < total.length; i++) {
        var radiosName = document.getElementsByName('answer-' + i);
        for (let j = 0; j < radiosName.length; j++) {
            radiosName[j].checked = false
            radiosName[j].disabled = false
            radiosName[j].style.boxShadow = 'none'
            document.getElementById('question-' + i).style.background = '#f6f6f6';
            document.getElementById('question-' + i).style.color = '#000';
        }
    }
}

function findArticle(term) {
    if (!document.getElementById('contents')) return
    let matches = [];
    document.getElementById('contents').innerHTML = '';
    for (let i = 0; i < data.length; i++) {
        let container = data[i].title + data[i].excerpt + data[i].path[0];
        if (container.toLowerCase().includes(term.toLowerCase())) {
            if(filterCondition.filterread && completed.includes(data[i].title) || filterCondition.filtertest && data[i].test == undefined) {
            } else {
                if(filterCondition.subjects != 'all' || filterCondition.level != 'all') {
                    let checkedSubject = false;
                    let checkedLevel = false;
                    let levels = ['first', 'second', 'third']
                    if(filterCondition.subjects != 'all') {
                        if(data[i].path[0] == filterCondition.subjects) {
                            checkedSubject = true;
                        }
                    } else {
                        checkedSubject = true;
                    }
                    if(filterCondition.level != 'all') {
                        if(filterCondition.level == levels[data[i].level - 1]) {
                            checkedLevel = true;
                        }
                    } else {
                        checkedLevel = true;
                    }
                    if(checkedLevel && checkedSubject) {
                        matches.push(data[i])
                    }
                } else {
                    matches.push(data[i]);
                }
            }
        }
    }
    matches.sort((a, b) => {
        if(filterCondition.sortby == 'level') { 
            return parseFloat(a.level) - parseFloat(b.level)
        } else if(filterCondition.sortby == 'alphabetic') {
            console.log(a.name)
            if(a.title < b.title) {
                return -1;
            }
            if(a.title > b.title) {
                return 1;
            }
            return 0;
        } else {
            return a - b
        }
    })
    if(filterCondition.reverse) {
        matches.reverse()
    }
    for(let i=0; i < matches.length; i++) {
        document.getElementById('contents').appendChild(drawCard(matches[i]))
    }
    if (matches.length == 0) {
        document.getElementById('contents').innerHTML = 'No results found'
    }
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
    articleItem.style.boxShadow = `10px 0px ${paths[findPath([data.path[0]], paths, 0, [], 'location')[0]].colour} inset`
    articleItem.onkeyup = (event) => {
        if (event.key == 'Enter') {
            if(data.url.includes('http')) {
                window.open(data.url);
            } else {
                currentPage = { url: data.url, title: data.title }
                currentPath = data.path
                changePage('article')
            }
        }
    }
    articleItem.onclick = () => {
        currentPage = { url: data.url, title: data.title }
        currentPath = data.path
        if(data.url.includes('http')) {
            window.open(data.url);
        } else {
            currentPage = { url: data.url, title: data.title }
            currentPath = data.path
            changePage('article')
        }
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
    return (itemNumber / totalNumber)
}

function renderLists(path, popstate = false) {
    if (!popstate) {
        state.path = currentPath;
        const url = new URL(location);
        url.searchParams.set("l", "home");
        url.searchParams.set("p", currentPath.join(','))
        history.pushState(state, "", url);
    }

    let list = [];
    document.getElementById('extras').innerHTML = `<a onclick="resetURL(); changePage('home')">Home</a>`;
    for (let i = 0; i < currentPath.length; i++) {
        let between = document.createElement('span');
        between.innerHTML = ' / ';
        document.getElementById('extras').appendChild(between);

        let element = document.createElement('a')
        element.innerHTML = currentPath[i]
        list.push(currentPath[i])
        let calc = findPath(list, paths, 0, [], 'subs');
        let calcName = JSON.stringify(list);
        element.tabIndex = '0'
        element.onclick = () => {
            currentPath = JSON.parse(calcName);
            console.log(calcName, calc[calc.length - 1])
            renderLists(calc[calc.length - 1]);
        }
        element.onkeydown = (event) => {
            if (event.key == 'Enter') {
                currentPath = JSON.parse(calcName);
                renderLists(calc[calc.length - 1]);
            }
        }
        document.getElementById('extras').appendChild(element);

    }

    document.getElementById('subjects').innerHTML = '';
    let noCards = 0;

    for (let i = 0; i < data.length; i++) {
        if (arraysEqual(data[i].path, currentPath)) {
            noCards+=1;
            document.getElementById('subjects').appendChild(drawCard(data[i]))
        }
    }

    if(!path && noCards == 0) {
        document.getElementById('subjects').innerHTML = 'Error retreiving data: Maybe try refreshing the page?'
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

        let clrWidth = calculatePercentage(currentPath.join(',') + ((currentPath.length > 0) ? ',' : '') + path[i].name) * (Math.min(window.innerWidth, 980) - 374) + 'px'
        console.log(window.innerWidtha)
        let clrHue = (path[i].colour) ? path[i].colour :
            paths[findPath(currentPath, paths, 0, [], 'location')[0]].colour
        nestFile.style.boxShadow = 'inset 10px 0 ' + clrHue + ', inset ' + clrWidth + ' 0 rgba(154, 255, 140, 0.2)';
        document.getElementById('subjects').appendChild(nestFile)
    }
}

let screen = 'home'
let previousScreen = screen

function changePage(newScene, popstate = false) {
    window.scrollTo(0, 0)
    if (!popstate) {
        state.page = newScene;
        const url = new URL(location);
        url.searchParams.set('l', newScene);
        if (newScene == 'search') {
            url.searchParams.set('q', window.search.value)
        } else if (newScene == 'article') {
            state.path = currentPath
            state.current = currentPage
            console.log(currentPage)
            url.searchParams.set('p', currentPath.join(','))
            url.searchParams.set('n', currentPage.url + ',' + currentPage.title)
        } else {
            state.path = []
            state.current = []
        }
        history.pushState(state, null, url);
    }
    if (html[newScene] && html[newScene].url) {
        window.container.innerHTML = `<div class="loading"></div>`
        fetch('https://flippont.github.io/redact/src/components/' + html[newScene].url + '.html')
            .then((response) => response.text())
            .then((text) => {
                window.container.innerHTML = text
                if (html[newScene] && html[newScene].onenter) {
                    html[newScene].onenter()
                }
                if (html[screen] && html[screen].onexit) {
                    html[screen].onexit()
                }
            })
    }

    previousScreen = screen
    screen = newScene
}

init = () => {
    currentPath = []
    const url = new URL(location);
    if (url.searchParams.get('q')) {
        window.search.value = url.searchParams.get('q');
    }
    if (url.searchParams.get('n')) {
        currentPage = { url: url.searchParams.get('n').split(',')[0], title: url.searchParams.get('n').split(',')[1] }
        console.log(currentPage)
    }
    if (url.searchParams.get('l')) {
        changePage(url.searchParams.get('l'), true)
    } else {
        changePage('home', true)
    }
}

window.onpopstate = (event) => {
    if (event.state) { state = event.state; }
    if (state.page == 'article') {
        currentPage = state.current
    }
    if (state.page == 'home') {
        currentPath = []
    } else if (state.path.length > 1 && state.page != 'article') {
        currentPath = state.path.pop()
    } else {
        currentPath = state.path
    }
    changePage(state.page, true)
}
    