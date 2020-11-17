// Import of fetchData.js
import {getData} from './fetchData.js';

// Url
const url = 'https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.1489/lat/57.3081/data.json';

// Retrieve all data
function getDataFromUrl(url) { 
    getData(url).then((data) => {
        addForecast(data);
     });
}

function addForecast(data) {
    /* -------------- G --------------- */

    var widget = document.getElementById("smhi-widget");
    console.log(widget)

    var obj = data.timeSeries[0].parameters; // Change to fetch more than 1 [0]

    var celsius = getParameters(obj).get("temp"); // Makes recursive over the number of temperatures

    /* Heading "Just nu" */
    var wrapper_now = document.createElement("div");

    var heading_now = document.createElement("h3");
    var text_heading_now = document.createTextNode("JUST NU");
    heading_now.appendChild(text_heading_now);

    wrapper_now.appendChild(heading_now);

    widget.appendChild(wrapper_now);

    var info_1 = document.createTextNode("I Djupvikshamn är det under nästkommande timme ")
    var info_2 = document.createTextNode(" grader.");

    var temperature = document.createTextNode(celsius);

    widget.appendChild(info_1);
    widget.appendChild(temperature);
    widget.appendChild(info_2);

    /* ------------ VG ----------------- */
    // Divider below this line
    var divider = document.createElement("div");
    divider.classList.add("divider");
    widget.appendChild(divider);
    // Divider above this line

    // Create the structure
    createStructure(widget);

    var valid_times = getValidTimes(data);
    var time_map_today = valid_times[0];
    var time_map_tomorrow = valid_times[1];

    createTable(time_map_today, time_map_tomorrow, widget);
}

function createTable(time_map_today, time_map_tomorrow) {
    var table_tomorrow = document.createElement("table");
    var table_tomorrow_body = document.createElement("tbody");

    var table_today = document.createElement("table");
    var table_today_body = document.createElement("tbody");

    if (time_map_today.size > 0) table_today = createCells(time_map_today, table_today, table_today_body);
    table_tomorrow = createCells(time_map_tomorrow, table_tomorrow, table_tomorrow_body);

    document.getElementById("today").appendChild(table_today);
    document.getElementById("tomorrow").appendChild(table_tomorrow);
}

function createCells(map, table, table_body) {
    const tableHeader = document.createElement('thead')
    const tableHeaderRow = document.createElement('tr')
    const headerCellsText = ['KI', 'Temp', 'VR', 'VS', 'Himmel']
    headerCellsText.forEach(text => {
        const headerCell = document.createElement('th')
        headerCell.textContent = text
        tableHeaderRow.appendChild(headerCell)
    })
    tableHeader.appendChild(tableHeaderRow)
    table.appendChild(tableHeader)
    var weather_desc = weatherDesc();
    for (let [key, val] of map) {
        var parameters = getParameters(val.parameters);
        var row = document.createElement('tr');
        var timeTd = document.createElement('td');
        timeTd.appendChild(document.createTextNode(key));
        row.appendChild(timeTd);
        
        for (let [k, v] of parameters) {
            var td = document.createElement('td');
            if (k == "weather_desc") {
                td.appendChild(document.createTextNode(weather_desc.get(v)));
            } else {
                td.appendChild(document.createTextNode(v));
            }
            row.appendChild(td);
        }  
        table_body.appendChild(row);
        table.appendChild(table_body);      
    }
    return table;
}

function createStructure(widget) {
    // Divider below this line
    var divider = document.createElement("div");
    divider.classList.add("divider");
    // Divider above this line
    var wrapper_today = document.createElement("div");
    var wrapper_tomorrow = document.createElement("div");

    var heading_today = document.createElement("h3");
    var text_heading_today = document.createTextNode("I DAG");
    heading_today.appendChild(text_heading_today);

    wrapper_today.appendChild(heading_today);
    wrapper_today.classList.add("wrapper-forecast");
    wrapper_today.id = "today";

    var heading_tomorrow = document.createElement("h3");
    var text_heading_tomorrow = document.createTextNode("I MORGON");
    heading_tomorrow.appendChild(text_heading_tomorrow);
    wrapper_tomorrow.appendChild(heading_tomorrow);
    wrapper_tomorrow.classList.add("wrapper-forecast");
    wrapper_tomorrow.id = "tomorrow";

    widget.appendChild(wrapper_today);
    widget.appendChild(divider);
    widget.appendChild(wrapper_tomorrow);
}

function getValidTimes(data) {
    // If time is after 6, 12, 18, show only remaining
    // If current time is known, get correct time
    // MIN time = 25 hours, time is 23.59
    // Max time = 48 hours, time is 00.01
    var time = parseInt(stripDate(data.timeSeries[0].validTime)) + 2; // Add 2 hours for swedish summertime
    var iterator = 48 - time; // Max time minus the time right now

    var time_map_today = new Map();
    var time_map_tomorrow = new Map();

    var d = new Date();
    var tomorrow = new Date(d.setDate(d.getDate() + 1)).toISOString();
    tomorrow = tomorrow.substring(0, 10);

    for (var i = 0; i < iterator; i++) {
        var iso_date = data.timeSeries[i].validTime;
        var current_time = parseInt(stripDate(data.timeSeries[i].validTime)) + 2;
        var current_day = iso_date.substring(0,10);
        
        if (current_day != tomorrow) { // Add in 'time_map_today'
            if (current_time == 6) {
                time_map_today.set("6", data.timeSeries[i]);
            } else if (current_time == 12) {
                time_map_today.set("12", data.timeSeries[i]);

            } else if (current_time == 18) {
                time_map_today.set("18", data.timeSeries[i]);
            }
        } else {
            if (current_time == 6) {
                time_map_tomorrow.set("6", data.timeSeries[i]);
            } else if (current_time == 12) {
                time_map_tomorrow.set("12", data.timeSeries[i]);

            } else if (current_time == 18) {
                time_map_tomorrow.set("18", data.timeSeries[i]);
            }
        }
    }
    return [time_map_today, time_map_tomorrow];
}

function getParameters(obj) {
    var info_map = new Map();
    for (var key in obj) {
        if (obj[key].name === "t") {
            info_map.set("temp", obj[key].values[0]);
        }
        if (obj[key].name === "wd") {
            info_map.set("wind_direction", obj[key].values[0]);
        }
        if (obj[key].name === "ws") {
            info_map.set("wind_strengh", obj[key].values[0]);
        }
        if (obj[key].name === "Wsymb2") {
            info_map.set("weather_desc", obj[key].values[0]);
        }
    }
    return info_map;
}

function stripDate(isoDate) {
    return isoDate.replace(/^[^:]*([0-2]\d:[0-5]\d).*$/, "$1");
}

function weatherDesc() {
    let weather_desc = new Map();
    weather_desc.set(1, "Klar himmel");
    weather_desc.set(2, "Nästan klar himmel");
    weather_desc.set(3, "Växlande molnighet");
    weather_desc.set(4, "Halvklart");
    weather_desc.set(5, "Molnigt");
    weather_desc.set(6, "Klart");
    weather_desc.set(7, "Dimma");
    weather_desc.set(8, "Lätta regnskurar");
    weather_desc.set(9, "Måttliga regnskurar");
    weather_desc.set(10, "Kraftiga regnskurar");
    weather_desc.set(11, "Åskväder");
    weather_desc.set(12, "Lätta skurar snöblandat regn");
    weather_desc.set(13, "Måttliga skurar snöblandat regn");
    weather_desc.set(14, "Kraftiga skurar snöblandat regn");
    weather_desc.set(15, "Lätta snöbyar");
    weather_desc.set(16, "Måttliga snöbyar");
    weather_desc.set(17, "Kraftiga snöbyar");
    weather_desc.set(18, "Lätt regn");
    weather_desc.set(19, "Måttligt regn");
    weather_desc.set(20, "Kraftigt regn");
    weather_desc.set(21, "Åska");
    weather_desc.set(22, "Lätt slask");
    weather_desc.set(23, "Måttligt slask");
    weather_desc.set(24, "Kraftigt slask");
    weather_desc.set(25, "Lätt snöfall");
    weather_desc.set(26, "Måttligt snöfall");
    weather_desc.set(27, "Kraftigt snöfall");
    return weather_desc;
}

// Call everything
getDataFromUrl(url);