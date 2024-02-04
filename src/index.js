let container = document.getElementById("container");
fetch('./src/data.json')
    .then((response) => response.json())
    .then((json) => console.log(json));