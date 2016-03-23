// This is a template for a Node.js scraper on morph.io (https://morph.io)
var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		resetTable(db);
		db.run("CREATE TABLE IF NOT EXISTS data (title TEXT, url TEXT, year INTEGER, daymonth STRING)");
		callback(db);
	});
}

function resetTable(db){
	db.run("DROP TABLE IF EXISTS data");
}
function updateRow(db, values) {
	// Insert some data.
	var statement = db.prepare("INSERT INTO data(title, url, year, daymonth) VALUES (?, ?, ?, ?)");
	statement.run(values);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, title, url, year, daymonth FROM data", function(err, row) {
		console.log(row.daymonth + ' ' + row.year);
		//console.log(row.id + ": " + row.title + ': ' + row.url + ': ' + row.daymonth +' ' + row.year);
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}

		callback(body);
	});
}

function run(db) {
	// Use request to read in pages.
	fetchPage("http://www.waternsw.com.au/customer-service/news/supplementary", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);
		var elements = $(".related-box ul .heading a").each(function () {
			var $link = $(this);
			var title = $link.text().trim();
			//If title has a hyphen
			if(title.indexOf('-') > -1){
				var titleSplit = title.split('-');
				var dayMonth;
				title = titleSplit[0];
				if(titleSplit[1]){
					dayMonth = titleSplit[1].trim();
				}
			}

			var url = $link.attr('href');
			var year = parseInt($link.closest('.related-box').find('h2').text());
			var daymonth = 'test';
			var values = [title, url, year, dayMonth];
			updateRow(db, values);

		});

		readRows(db);

		db.close();
	});
}

initDatabase(run);
