var line_chart
var pie_recovery
var pie_deaths
var bar_1
var line_1
var line_2

var initial = true
var summaryData
var countryData

const body = document.querySelector("body")
const loaderWrapper = document.querySelector('.loader_wrapper')

window.onload = async () => {
    /* Input for location of data */
    let location = 'Global'

    const params = (new URL(document.location)).searchParams
    const temp = params.get('location')
    if(!(temp === null)){
        location = temp
    }
    loadData(location)
}

async function initSummaryData() {
    summaryData = await covidApi.getSummary()
}

async function initCountryData(country) {
    countryData = await loadCountryData(country)
}

async function loadSummary(country) {
    console.log(summaryData)
    let summary = summaryData.Global
    if (!(country === 'Global')) {
        summary = summaryData.Countries.filter(e => e.Slug === country)[0]
    }
    showTotalConfirmed(summary.TotalConfirmed)
    showTotalRecovered(summary.TotalRecovered)
    showTotalDeaths(summary.TotalDeaths)
    showNewConfirmed(summary.NewConfirmed)
    showNewRecovered(summary.NewRecovered)
    showNewDeaths(summary.NewDeaths)
}

async function loadCountryData(country) {
    let confirmed
    let recovered
    let deaths
    let countryData = {
        TotalConfirmed: [],
        TotalRecovered: [],
        TotalDeaths: [],
        NewConfirmed: [],
        NewRecovered: [],
        NewDeaths: [],
        dates: []
    }
    if (!(country === 'Global')) {
        confirmed = await covidApi.getCountryData(country, 'confirmed')
        recovered = await covidApi.getCountryData(country, 'recovered')
        deaths = await covidApi.getCountryData(country, 'deaths')

        confirmed.forEach(element => {
            countryData.TotalConfirmed.push(element.Cases)
            countryData.dates.push(element.Date.substr(0, 10))
        });
        recovered.forEach(element => {
            countryData.TotalRecovered.push(element.Cases)
        });
        deaths.forEach(element => {
            countryData.TotalDeaths.push(element.Cases)
        });

    } else {
        world_data = await covidApi.getWorldData()
        world_data.sort((a, b) => new Date(a.Date) - new Date(b.Date))
        world_data.forEach(element => {
            countryData.TotalConfirmed.push(element.TotalConfirmed)
            countryData.TotalRecovered.push(element.TotalRecovered)
            countryData.TotalDeaths.push(element.TotalDeaths)
            countryData.NewConfirmed.push(element.NewConfirmed)
            countryData.NewRecovered.push(element.NewRecovered)
            countryData.NewDeaths.push(element.NewDeaths)
            countryData.dates.push(element.Date.substr(0, 10))
        })
    }
    return countryData
}

async function loadData(country) {
    startLoading()

    await initSummaryData()
    await initCountryData(country)
    await loadSummary(country)
    await initLine()
    await initLineOne()
    await initLineTwo()
    await initPieRecovery(country)
    await initPieDeaths(country)
    //await initBarOne()
    if (initial) { await initializeCountrySelect(country) }
    endLoading()
}

function startLoading() {
    loaderWrapper.classList.add('loading')
    body.style.overflow = "hidden"
    body.scrollTo(0, 0)
}

function endLoading() {
    loaderWrapper.classList.remove('loading')
    body.style.overflow = "initial"
}

async function initLine() {
    let data = countryData
    line_chart = new Chart(document.getElementById('line_chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Confirmed',
                data: data.TotalConfirmed,
                fill: false,
                borderColor: 'rgb(255, 0, 0)',
                tension: 0.1
            },
            {
                label: 'Recovered',
                data: data.TotalRecovered,
                fill: false,
                borderColor: 'rgb(0, 128, 0)',
                tension: 0.1
            },
            {
                label: 'Deaths',
                data: data.TotalDeaths,
                fill: false,
                borderColor: 'rgb(55, 60, 67)',
                tension: 0.1
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Line chart of cases over time',
                    color: '#2f3640',
                    padding: 20,
                    font: {
                        family: "'Montserrat', sans-serif",
                        size: 32
                    }

                },
                tooltip: {
                    intersect: false,
                    mode: 'index',
                    position: 'nearest'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            layout: {
                padding: {
                    left: 25,
                    right: 25
                }
            }
        }
    });
}

async function initLineOne() {
    let data = countryData
    let values = []
    for (let i = 0; i < data.dates.length; i++) {
        values.push((data.TotalRecovered[i] / data.TotalConfirmed[i] * 100).toFixed(2))
    }
    line_1 = new Chart(document.getElementById('line_1').getContext('2d'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: 'Recovery Rate',
                    data: values,
                    fill: false,
                    borderColor: 'rgb(0, 128, 0)',
                    backgroundColor: 'rgba(0, 128, 0, 0.1)',
                    tension: 0.1,
                    fill: true
                },
            ]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Recovery Rate over time',
                    color: '#2f3640',
                    padding: 20,
                    font: {
                        family: "'Montserrat', sans-serif",
                        size: 24
                    }

                },
                tooltip: {
                    intersect: false,
                    mode: 'index',
                    position: 'nearest'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            layout: {
                padding: {
                    left: 25,
                    right: 25
                }
            }
        }
    });
}

async function initLineTwo() {
    let data = countryData
    let values = []
    for (let i = 0; i < data.dates.length; i++) {
        values.push((data.TotalDeaths[i] / data.TotalConfirmed[i] * 100).toFixed(2))
    }
    line_2 = new Chart(document.getElementById('line_2').getContext('2d'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: 'Death Rate',
                    data: values,
                    fill: false,
                    borderColor: 'rgb(55, 60, 67)',
                    backgroundColor: 'rgba(55, 60, 67, 0.1)',
                    tension: 0.1,
                    fill: true
                },
            ]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Death Rate over time',
                    color: '#2f3640',
                    padding: 20,
                    font: {
                        family: "'Montserrat', sans-serif",
                        size: 24
                    }

                },
                tooltip: {
                    intersect: false,
                    mode: 'index',
                    position: 'nearest'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            },
            layout: {
                padding: {
                    left: 25,
                    right: 25
                }
            }
        }
    });
}

async function initPieRecovery(country) {
    let data = summaryData.Global
    if (!(country === 'Global')) {
        data = summaryData.Countries.filter(e => e.Slug === country)[0]
    }
    const recoveryRate = (data.TotalRecovered / data.TotalConfirmed * 100).toFixed(2);

    ctx = document.getElementById('pie_recovery').getContext('2d')

    pie_recovery = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['confirmed', 'Recovery Rate'],
            datasets: [
                {
                    label: 'Dataset 1',
                    data: [100 - recoveryRate, recoveryRate],
                    backgroundColor: [
                        'rgba(0, 0, 0, 0.1)',
                        'rgb(0, 128, 0)'
                    ]
                }
            ],
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Current recovery rate: ' + recoveryRate + '%',
                    color: '#2f3640',
                    padding: 20,
                    font: {
                        family: "'Montserrat', sans-serif",
                        size: 24
                    }
                },
                legend: {
                    display: false
                }

            },
            layout: {
                padding: {
                    left: 5,
                    right: 5,
                    bottom: 5
                }
            }
        },
    });
}

async function initPieDeaths(country) {
    let data = summaryData.Global
    if (!(country === 'Global')) {
        data = summaryData.Countries.filter(e => e.Slug === country)[0]
    }
    const deathRate = (data.TotalDeaths / data.TotalConfirmed * 100).toFixed(2);

    ctx = document.getElementById('pie_deaths').getContext('2d')

    pie_deaths = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['confirmed', 'Death rate'],
            datasets: [
                {
                    label: 'Dataset 1',
                    data: [100 - deathRate, deathRate],
                    backgroundColor: [
                        'rgba(0, 0, 0, 0.1)',
                        'rgb(55, 60, 67)'
                    ]
                }
            ],
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Current death rate: ' + deathRate + '%',
                    color: '#2f3640',
                    padding: 20,
                    font: {
                        family: "'Montserrat', sans-serif",
                        size: 24
                    }
                },
                legend: {
                    display: false
                }

            },
            layout: {
                padding: {
                    left: 5,
                    right: 5,
                    bottom: 5
                }
            }
        },
    });
}



function resetChart() {
    line_chart.destroy()
    pie_recovery.destroy()
    pie_deaths.destroy()
    line_1.destroy()
    line_2.destroy()
}

/* update html */
function showTotalConfirmed(data) {
    document.querySelector('#total_confirmed').textContent = data
}

function showTotalRecovered(data) {
    document.querySelector('#total_recovered').textContent = data
}

function showTotalDeaths(data) {
    document.querySelector('#total_deaths').textContent = data
}

function showNewConfirmed(data) {
    document.querySelector('#new_confirmed').textContent = data
}

function showNewRecovered(data) {
    document.querySelector('#new_recovered').textContent = data
}

function showNewDeaths(data) {
    document.querySelector('#new_deaths').textContent = data
}

/* Get list of all countries */
async function getCountries() {
    const countriesData = await covidApi.getCountries()
    return countriesData
}

function getAvaliableCountries() {
    countries = []
    summaryData.Countries.forEach(country => {
        countries.push(country.Country)
    })
    return countries.sort();
}
/* Initialize Country Select */
async function initializeCountrySelect(country) {
    countriesNames = await getCountries()
    countries = getAvaliableCountries()
    console.log(countries);

    const selected = document.querySelector('.selected')
    selected.innerHTML = country.charAt(0).toUpperCase() + country.slice(1);
      

    const optionsContainer = document.querySelector('.options_container')
    countries.forEach(country => {

        const inputTag = document.createElement('input')
        inputTag.setAttribute('type', 'radio')
        inputTag.setAttribute('id', country)
        inputTag.classList.add('radio')

        const labelTag = document.createElement('label')
        labelTag.setAttribute('for', country)
        labelTag.innerHTML = country

        const option = document.createElement('div')
        option.classList.add('option')

        option.appendChild(inputTag)
        option.appendChild(labelTag)

        optionsContainer.appendChild(option)

    })

    countrySelectFunction()
}

/* Country Select functionality*/
function countrySelectFunction() {
    const selected = document.querySelector('.selected')
    const optionsContainer = document.querySelector('.options_container')
    const searchBox = document.querySelector(".search_box input")
    const optionsList = document.querySelectorAll(".option")

    selected.addEventListener("click", () => {
        optionsContainer.classList.toggle('active');
        searchBox.value = ''
        filterList('')

        if (optionsContainer.classList.contains('active')) {
            searchBox.focus()
        }
    })

    optionsList.forEach(element => {

        element.addEventListener("click", () => {
            selected.innerHTML = element.querySelector("label").innerHTML
            optionsContainer.classList.remove("active")
            let location
            countriesNames.forEach(item => {
                if (element.textContent === item.Country) {
                    location = item.Slug

                }
            })
            initial = false
            if (location == null) {
                location = 'Global'
            }

            loadData(location)
            resetChart()
        })
    })

    searchBox.addEventListener("keyup", event => {
        filterList(event.target.value)
    })

    const filterList = searchTerm => {
        searchTerm = searchTerm.toLowerCase()
        optionsList.forEach(option => {
            let label = option.firstElementChild.nextElementSibling.innerHTML.toLowerCase() /* access text in label tag */
            /* Check if searchTerm is in label */
            if (label.indexOf(searchTerm) != -1) {
                option.style.display = 'block'
            } else {
                option.style.display = 'none'
            }
        })
    }
}




