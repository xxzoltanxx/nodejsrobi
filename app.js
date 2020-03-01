var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cookieSession = require("cookie-session");
var fileUpload = require("express-fileupload");
var nodemailer = require("nodemailer");

mongoose.connect("mongodb+srv://fhc:Af0035182443@cluster0-g7xnk.mongodb.net/fhc?retryWrites=true&w=majority", {useNewUrlParser: "true", useCreateIndex: "true"}).then(function() { console.log("connected")});
var adminScheme = mongoose.Schema(
{
	email: String,
	password: String
});

var karticaScheme = mongoose.Schema(
{
	title : String,
	tags : String,
	lines : String,
	price : String,
	picture: String
});

var transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'fhcmailer@gmail.com',
        pass: 'RF493395'
    }
});

var Admin = mongoose.model("admin", adminScheme);
var Kartica = mongoose.model("kartica", karticaScheme);

var app = express();

app.use(fileUpload());
app.use(express.static("uploads"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieSession({
  name: 'session',
  keys: ["SECRETKEYCOOKIEYOLO"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.get("/", function(req, res)
	   {
	res.render("index.ejs", {logedIn: req.session.loggedIn });
});

app.post("/mail", function(req, res)
		 {
	const mailOptions = {
  from: req.body.email, // sender address
  to: 'robert.franjcic@gmail.com', // list of receivers
  subject: 'Nova poruka s web sitea: ' + req.body.subject, // Subject line
  html: req.body.name + ": " + req.body.email + ": " + req.body.message// plain text body
};
	transporter.sendMail(mailOptions, function (err, info) {
		res.redirect("/");
});
});
app.get("/panel", function(req, res)
	   {
	if (!req.session.loggedIn)
		{
			res.redirect("/");
		}
	else
		{
			var allData = Kartica.find({}, function(err, data)
									  {
				if (err)
					{
						res.redirect("loginfail");
					}
				else
					{
						res.render("controlPanel.ejs", {data: data});
					}
			})
		}
});

app.post("/delete", function(req, res)
		{
	if (!req.session.loggedIn)
		{
			res.redirect("/loginfail");
		}
	else
		{
			var name = req.body.name;
			Kartica.deleteOne({title: name}, function(err)
			{
				res.redirect("/panel");
			});
		}
});

app.get("/AboutUs", function(req, res)
	   {
	res.render("AboutUs.ejs");
});

app.get("/services", function(req, res)
	   {
	res.render("services.ejs");
});

app.get("/contact", function(req, res)
{
	if (req.query)
		res.render("contact.ejs", {oglasTitle : req.query.oglasTitle});
	else
		res.render("contact.ejs", {oglasTitle : null});
});

app.get("/passcode", function(req, res)
	   {
	if (!req.session.loggedIn)
	{
		res.render("passcode.ejs");
	}
	else
		{
			res.redirect("/");
		}
});

app.get("/loginfail", function(req, res)
	   {
	res.render("loginFail.ejs");
})

app.post("/passcode", function(req, res)
		 {
	var email = req.body.email;
	var password = req.body.pass;
	Admin.find({
		email: email,
		password: password
	}, function(err, returned)
			   {
		if (err)
			{
				res.redirect("/loginfail")
			}
		else if (returned.length > 0)
			{
				req.session.loggedIn = true;
				res.redirect("/");
			}
		else
			{
				res.redirect("/loginfail");
			}
	});
});

app.post("/newItem", function(req, res)
{
	let sampleFile = req.files.slika;
	sampleFile.mv(__dirname + '/uploads/' + sampleFile.name);
	var newItem = new Kartica({title : req.body.title, lines : req.body.description, price: req.body.price, tags: req.body.tags, picture: sampleFile.name});
	newItem.save(function(err, item) {
		res.redirect("/panel"); });
});

app.get("/najam", function(req, res)
	   {
	console.log(req.query);
	if (req.query.searchTerm)
		{
			console.log("hit");
			displayOnSite(req.query.searchTerm, res, req.query.page);
		}
	else
		{
			console.log("not hit")
			displayOnSiteAll(res, req.query.page);
		}
});

app.get("*", function(req, res)
	   {
	res.redirect("/");
});

function displayOnSite(searchTerm, res, page)
{
		var allAds = Kartica.find({}, function(err, data)
							 {
		if (err)
			{
				res.redirect("/loginfail");
			}
		else
			{
				if (!page)
					{
						page = 0;
					}
				var selected = [];
				for (var i = 0; i < data.length; ++i)
					{
						var cell = data[i];
						if (cell.title.includes(searchTerm))
							{
								selected.push(cell);
							}
						else if (cell.tags.includes(searchTerm))
							{
								selected.push(cell);
							}
						else if (cell.lines.includes(searchTerm))
							{
								selected.push(cell);
							}
						
					}
				var start = page * 10;
				var end = start + 10;
				if (selected.length < start + 10)
					end = selected.length;
				
				pages = Math.ceil(data.length / 10);
				res.render("najam.ejs", {data: selected.slice(start, end), page: page, pages: pages, searchTerm: searchTerm});
			}
	})
}

function displayOnSiteAll(res, page, pages)
{
	var allAds = Kartica.find({}, function(err, data)
							 {
		if (err)
			{
				res.redirect("/loginfail");
			}
		else
			{
				if (!page)
					{
						page = 0;
					}
				var start = page * 12;
				var end = start + 12;
				if (data.length < start + 12)
					end = data.length;
				
				pages = Math.ceil(data.length / 12);
				res.render("najam.ejs", {data: data.slice(start, end), page: page, pages: pages, searchTerm: undefined});
			}
	})
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, function() {
	console.log("started listening");
})