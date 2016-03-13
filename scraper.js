// This is a template for a Node.js scraper on morph.io (https://morph.io)
var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS data (title TEXT, url TEXT, year INTEGER)");
		callback(db);
	});
}

function updateRow(db, values) {
	// Insert some data.
	var statement = db.prepare("INSERT INTO data(title, url, year) VALUES (?, ?, ?)");
	statement.run(values);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT rowid AS id, title, url, year FROM data", function(err, row) {
		console.log(row.id + ": " + row.title + ': ' + row.url + ': ' + row.year);
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
			var url = $link.attr('href');
			var year = parseInt($link.closest('.related-box').find('h2').text());
			var values = [title, url, year];
			updateRow(db, values);

		});

		readRows(db);

		db.close();
	});
}

initDatabase(run);
