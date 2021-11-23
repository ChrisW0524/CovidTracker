import { countriesData } from "./countries-data.js"

var globalData
var line_chart
var lineData
var countriesList
var colors

const body = document.querySelector("body")
const loaderWrapper = document.querySelector('.loader_wrapper')

window.onload = async () => {
	startLoading()

	await initGlobalData()
	await initBarOne()
	await initBarTwo()
	await initBarThree()
	await initLineOne()
	await initLineTwo()
	await initLineThree()
	await initMap()
	initRadio()

	endLoading()
	
	await initLine()
}

async function initGlobalData() {
	globalData = await loadGlobalData()
}

async function loadGlobalData() {
	let countryData = {
		TotalConfirmed: [],
		TotalRecovered: [],
		TotalDeaths: [],
		NewConfirmed: [],
		NewRecovered: [],
		NewDeaths: [],
		dates: []
	}

	const world_data = await covidApi.getWorldData()
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

	return countryData
}


async function loadCountryData(country) {
	let confirmed
	let recovered
	let deaths
	let countryData = {
		Country: country,
		TotalConfirmed: [],
		TotalRecovered: [],
		TotalDeaths: [],
		dates: []
	}
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
	return countryData

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

async function initMap() {
	const summaryData = await covidApi.getSummary()
	console.log(summaryData);

	//add cases to countries Data
	countriesData.features.forEach(i => {
		summaryData.Countries.forEach(j => {
			if (i.properties.name === j.Country) {
				i.properties.cases = j.TotalConfirmed
				i.properties.slug = j.Slug
			}
		})
		if (i.properties.cases == null) {
			i.properties.cases = "N/A"
			i.properties.slug = null
		}
	});

	console.log(countriesData);

	//put values of cases into an array
	let values = []
	
	countriesData.features.forEach(country => {
		values.push(country.properties.cases)
	})

	//values = values.sort((a, b) => a - b);

	var map = L.map('map').setView([0, 0], 3);
	L.tileLayer('https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=9Nvo0KiD7dG0zZ8NTVtl', {
		tileSize: 512,
		zoomOffset: -1,
		minZoom: 2,
		attribution: "\u003ca href=\"https://www.maptiler.com/copyright/\" target=\"_blank\"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e",
		crossOrigin: true,
		noWrap: true,
	}).addTo(map);
	//map.setMaxBounds(map.getBounds());

	L.geoJson(countriesData).addTo(map);

	var info = L.control();

	info.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info');
		this.update();
		return this._div;
	};

	info.update = function (props) {
		this._div.innerHTML = '<h4>Number of Cases</h4>' + (props ?
			'<b>' + props.name + '</b><br />' + props.cases + ' people'
			: 'Hover over a country');
	};

	info.addTo(map);


	// get color depending on cases
	function getColor(d) {
		return d > 1000000 ? '#800026' :
			d > 500000 ? '#BD0026' :
				d > 200000 ? '#E31A1C' :
					d > 100000 ? '#FC4E2A' :
						d > 50000 ? '#FD8D3C' :
							d > 20000 ? '#FEB24C' :
								d > 10000 ? '#FED976' :
									'#FFEDA0';
	}

	function style(feature) {
		return {
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7,
			fillColor: getColor(feature.properties.cases)
		};
	}

	function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 5,
			color: '#666',
			dashArray: '',
			fillOpacity: 0.7
		});

		if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
			layer.bringToFront();
		}

		info.update(layer.feature.properties);
	}

	var geojson;

	function resetHighlight(e) {
		geojson.resetStyle(e.target);
		info.update();
	}

	function redirectPage(e) {
		console.log(e.target.feature.properties.slug);
		window.open(
			"data.html?location="+e.target.feature.properties.slug,
			'_blank'
		)
	}

	function onEachFeature(feature, layer) {
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: redirectPage
		});
	}

	geojson = L.geoJson(countriesData, {
		style: style,
		onEachFeature: onEachFeature
	}).addTo(map);

	map.attributionControl.addAttribution('Source: <a href="https://documenter.getpostman.com/view/10808728/SzS8rjbc">Coronavirus COVID19 API</a>');


	var legend = L.control({ position: 'bottomright' });

	legend.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
			grades = [0, 10000, 20000, 50000, 100000, 200000, 500000, 1000000],
			labels = [],
			from, to;

		for (var i = 0; i < grades.length; i++) {
			from = grades[i];
			to = grades[i + 1];

			labels.push(
				'<i style="background:' + getColor(from + 1) + '"></i> ' +
				from + (to ? '&ndash;' + to : '+'));
		}

		div.innerHTML = labels.join('<br>');
		return div;
	};

	legend.addTo(map);

}

/* Chart Setup */

async function initBarOne() {
	var data = []
	for (let i = 0; i < globalData.dates.length; i++) {
		data.push({
			dates: globalData.dates[i],
			newConfirmed: globalData.NewConfirmed[i]
		})
	}
	console.log(data);
	// sort array of objects based on newConfirmed and returns largest 10 objects 
	const slicedData = data.sort((a, b) => (a.newConfirmed > b.newConfirmed) ? -1 : 1).slice(0, 10)
	let label = []
	let values = []
	slicedData.forEach(element => {
		label.push(element.dates.substr(0, 10));
		values.push(element.newConfirmed)
	})

	var bar_1 = new Chart(document.getElementById('bar_1').getContext('2d'), {
		type: 'bar',
		data: {
			labels: label,
			datasets: [{
				label: 'New confirmed cases',
				data: values,
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
				],
				borderColor: [
					'rgb(255, 99, 132)',
				],
				borderWidth: 1
			}]
		},
		options: {
			maintainAspectRatio: false,
			responsive: true,
			indexAxis: 'y',
			plugins: {
				title: {
					display: true,
					text: 'Most new confirmed cases daily',
					color: '#2f3640',
					padding: 20,
					font: {
						family: "'Montserrat', sans-serif",
						size: 24
					}

				},
				tooltip: {
					mode: 'nearest',
				}
			},
			layout: {
				padding: {
					left: 25,
					right: 35,
					bottom: 25,
				}
			}
		}
	});
}

async function initBarTwo() {
	var data = []
	for (let i = 0; i < globalData.dates.length; i++) {
		data.push({
			dates: globalData.dates[i],
			newRecovered: globalData.NewRecovered[i]
		})
	}
	console.log(data);
	// sort array of objects based on newConfirmed and returns largest 10 objects 
	const slicedData = data.sort((a, b) => (a.newRecovered > b.newRecovered) ? -1 : 1).slice(0, 10)
	let label = []
	let values = []
	slicedData.forEach(element => {
		label.push(element.dates.substr(0, 10));
		values.push(element.newRecovered)
	})

	var bar_2 = new Chart(document.getElementById('bar_2').getContext('2d'), {
		type: 'bar',
		data: {
			labels: label,
			datasets: [{
				label: 'New recovered cases',
				data: values,
				backgroundColor: [
					'rgba(0, 128, 0, 0.2)',
				],
				borderColor: [
					'rgb(0, 128, 0)',
				],
				borderWidth: 1
			}]
		},
		options: {
			maintainAspectRatio: false,
			responsive: true,
			indexAxis: 'y',
			plugins: {
				title: {
					display: true,
					text: 'Most new recovered cases daily',
					color: '#2f3640',
					padding: 20,
					font: {
						family: "'Montserrat', sans-serif",
						size: 24
					}

				},
				tooltip: {
					mode: 'nearest',
				}
			},
			layout: {
				padding: {
					left: 25,
					right: 35,
					bottom: 25,
				}
			}
		}
	});
}

async function initBarThree() {
	var data = []
	for (let i = 0; i < globalData.dates.length; i++) {
		data.push({
			dates: globalData.dates[i],
			newDeaths: globalData.NewDeaths[i]
		})
	}
	console.log(data);
	// sort array of objects based on newConfirmed and returns largest 10 objects 
	const slicedData = data.sort((a, b) => (a.newDeaths > b.newDeaths) ? -1 : 1).slice(0, 10)
	console.log(slicedData);
	let label = []
	let values = []
	slicedData.forEach(element => {
		label.push(element.dates.substr(0, 10));
		values.push(element.newDeaths)
	})

	var bar_3 = new Chart(document.getElementById('bar_3').getContext('2d'), {
		type: 'bar',
		data: {
			labels: label,
			datasets: [{
				label: 'New deaths',
				data: values,
				backgroundColor: [
					'rgba(55, 60, 67, 0.2)',
				],
				borderColor: [
					'rgb(55, 60, 67)',
				],
				borderWidth: 1
			}]
		},
		options: {
			maintainAspectRatio: false,
			responsive: true,
			indexAxis: 'y',
			plugins: {
				title: {
					display: true,
					text: 'Most new deaths daily',
					color: '#2f3640',
					padding: 20,
					font: {
						family: "'Montserrat', sans-serif",
						size: 24
					}

				},
				tooltip: {
					mode: 'nearest',
				}
			},
			layout: {
				padding: {
					left: 25,
					right: 35,
					bottom: 25,
				}
			}
		}
	});
}

async function initLineOne() {
	let data = globalData
	let values = []
	for (let i = 0; i < data.dates.length; i++) {
		values.push(data.NewConfirmed[i])
	}

	console.log(data);
	var line_1 = new Chart(document.getElementById('line_1').getContext('2d'), {
		type: 'line',
		data: {
			labels: data.dates,
			datasets: [
				{
					label: 'New confimed cases',
					data: values,
					fill: false,
					borderColor: 'rgb(255, 99, 132)',
					backgroundColor: 'rgba(255, 99, 132, 0.1)',
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
					text: 'Daily new confirmed cases over time',
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
	let data = globalData
	let values = []
	for (let i = 0; i < data.dates.length; i++) {
		values.push(data.NewRecovered[i])
	}

	console.log(data);
	var line_2 = new Chart(document.getElementById('line_2').getContext('2d'), {
		type: 'line',
		data: {
			labels: data.dates,
			datasets: [
				{
					label: 'New recovered cases',
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
					text: 'Daily new recovered cases over time',
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

async function initLineThree() {
	let data = globalData
	let values = []
	for (let i = 0; i < data.dates.length; i++) {
		values.push(data.NewDeaths[i])
	}

	console.log(data);
	var line_3 = new Chart(document.getElementById('line_3').getContext('2d'), {
		type: 'line',
		data: {
			labels: data.dates,
			datasets: [
				{
					label: 'New deaths',
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
					text: 'Daily new deaths over time',
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

async function initLine() {
	lineData = []
	var data_format = []
	countriesList = ['india', 'japan', 'united-arab-emirates', 'italy', 'germany', 'brazil', 'malaysia']
	colors = ['rgb(26, 188, 156)', 'rgb(46, 204, 113)', 'rgb(52, 152, 219)', 'rgb(155, 89, 182)', 'rgb(52, 73, 94)', 'rgb(243, 156, 18)', 'rgb(211, 84, 0)']
	for (let i = 0; i < countriesList.length; i++){lineData.push(await loadCountryData(countriesList[i]))}

	for (let i = 0; i < lineData.length; i++) {
        data_format.push({
			label: lineData[i].Country,
			data: lineData[i].TotalConfirmed,
			fill: false,
			borderColor: colors[i],
			tension: 0.1
		})
    }

	console.log(lineData);
	let data = globalData
	line_chart = new Chart(document.getElementById('country_line').getContext('2d'), {
		type: 'line',
		data: {
			labels: data.dates,
			datasets: data_format
		},
		options: {
			maintainAspectRatio: false,
			responsive: true,
			plugins: {
				title: {
					display: true,
					text: 'COVID-19 Infection Trajectories (7 countries)',
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
					beginAtZero: true,
					max: 800000
				},
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

function updateLineChart(element){
	let data_format = []
	line_chart.data.labels.pop();
    line_chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    line_chart.update();
	if(element === 'TotalConfirmed'){
		for (let i = 0; i < lineData.length; i++) {
			data_format.push({
				label: lineData[i].Country,
				data: lineData[i].TotalConfirmed,
				fill: false,
				borderColor: colors[i],
				tension: 0.1
			})
		}
		line_chart.data.datasets = data_format
		line_chart.options.scales.y.max = 800000

	}
	if(element === 'TotalRecovered'){
		for (let i = 0; i < lineData.length; i++) {
			data_format.push({
				label: lineData[i].Country,
				data: lineData[i].TotalRecovered,
				fill: false,
				borderColor: colors[i],
				tension: 0.1
			})
		}
		line_chart.data.datasets = data_format
		line_chart.options.scales.y.max = 450000
	}
	if(element === 'TotalDeaths'){
		for (let i = 0; i < lineData.length; i++) {
			data_format.push({
				label: lineData[i].Country,
				data: lineData[i].TotalDeaths,
				fill: false,
				borderColor: colors[i],
				tension: 0.1
			})
		}
		line_chart.data.datasets = data_format
		line_chart.options.scales.y.max = 50000
	}
	line_chart.update()
}
function initRadio(){
	const radio_confirmed = document.querySelector('#confirmed')
	const radio_recovered = document.querySelector('#recovered')
	const radio_deaths = document.querySelector('#deaths')

	radio_confirmed.addEventListener('click', (event) => {
		updateLineChart('TotalConfirmed')
	})
	radio_recovered.addEventListener('click', (event) => {
		updateLineChart('TotalRecovered')
	})
	radio_deaths.addEventListener('click', (event) => {
		updateLineChart('TotalDeaths')
	})
}