// app/routes.js

var crypto = require('crypto');
var multer = require('multer');
var path = require('path');
const fs = require('fs');
var url = require('url');
var http = require('http');
var https = require('https');
var chalk = require('chalk');
var ffmpeg = require('fluent-ffmpeg');
var ffmpegPath = require("ffmpeg-static");

var User = require('../models').User;
var VideoLists = require('../models').VideoLists;
var AdsLists = require('../models').AdsLists;
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'videos/');
	},

	// By default, multer removes file extensions so let's add them back
	filename: function (req, file, cb) {
		cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});

module.exports = function (app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', isLoggedIn, async function (req, res) {
		const videos = await VideoLists.findAll({
			raw: true
		});
		res.render('page/video-list', {
			title: 'Admin Board',
			lists: videos
		}); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function (req, res) {
		res.render('page/login', {
			title: 'Admin Board'
		});
	});

	// process the login form
	app.post('/login',
		passport.authenticate('local-login', {
			successRedirect: '/', // redirect to the secure profile section
			failureRedirect: '/login', // redirect back to the signup page if there is an error
			failureFlash: true // allow flash messages
		}),
		function (req, res) {
			console.log("hello");

			if (req.body.remember) {
				req.session.cookie.maxAge = 1000 * 60 * 3;
			} else {
				req.session.cookie.expires = false;
			}
			res.redirect('/');
		});

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function (req, res) {
		// render the page and pass in any flash data if it exists
		res.render('page/signup', {
			message: req.flash('signupMessage')
		});
	});

	// process the signup form
	app.post('/signup', async function (req, res) {
		try {
			const user = new User({
				...req.body
			});

			user.salt = crypto.randomBytes(16).toString('hex');
			user.hash = crypto.pbkdf2Sync(req.body.password, user.salt, 1000, 64, `sha512`).toString(`hex`);

			await user.save();
			res.redirect('/login');
		} catch (err) {
			res.render('page/signup', {
				err
			});
		}
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

	// =====================================
	// Videos routing ==============================
	// =====================================
	app.post('/upload', isLoggedIn, async (req, res) => {
		let upload = multer({
			storage: storage,
			fileFilter: imageFilter
		}).single('video_file');

		upload(req, res, async function (err) {
			// req.file contains information of uploaded file
			// req.body contains information of text fields, if there were any

			if (req.fileValidationError) {
				return res.send(req.fileValidationError);
			} else if (!req.file) {
				return res.send('Please select an image to upload');
			} else if (err instanceof multer.MulterError) {
				return res.send(err);
			} else if (err) {
				return res.send(err);
			}

			res.send({
				status: true,
				name: req.file.filename
			});
		});
	});

	app.post('/videos', isLoggedIn, async (req, res) => {
		// if (parseInt(req.body.sourceType) > 0) {
		// 	var client = 
		// }
		try {
			const maxOrder = await VideoLists.max('order');
			let order = 0;
			if (maxOrder && !isNaN(maxOrder)) {
				order = maxOrder + 1;
			}
			const video = new VideoLists({
				title: req.body.title,
				path: req.body.path,
				type: req.body.sourceType,
				order
			});
			await video.save();
			res.redirect('/');
		} catch (error) {
			res.send(error);
		}
		const videos = await VideoLists.findAll({
			raw: true
		});

		mergeFilesAsync(videos)
			.then(result => {
				console.log('success merge');
			})
	})

	app.post('/videos/delete/:id', isLoggedIn, async (req, res) => {
		const id = req.params.id;

		await VideoLists.destroy({
			where: {
				id
			}
		});
		res.redirect('/');
		const videos = await VideoLists.findAll({
			raw: true
		});

		mergeFilesAsync(videos)
			.then(result => {
				console.log('success merge');
			})
	});

	//====================================================
	// Advertise Routing =================================
	//====================================================

	app.get('/advertise', isLoggedIn, async (req, res) => {
		const videos = await AdsLists.findAll({
			raw: true
		});
		res.render('page/ad-list', {
			title: 'Admin Board',
			lists: videos
		}); // load the index.ejs file
	});

	app.post('/advertise', isLoggedIn, async (req, res) => {
		try {
			const maxOrder = await AdsLists.max('order');
			let order = 0;
			if (maxOrder && !isNaN(maxOrder)) {
				order = maxOrder + 1;
			}
			const video = new AdsLists({
				title: req.body.title,
				path: req.body.path,
				type: req.body.sourceType,
				time: req.body.time,
				order
			});
			await video.save();
			return res.redirect('/advertise');
		} catch (error) {
			return res.send(error);
		}
	});

	app.post('/advertise/delete/:id', isLoggedIn, async (req, res) => {
		const id = req.params.id;

		await AdsLists.destroy({
			where: {
				id
			}
		});
		res.redirect('/advertise');
	});

	app.get('/stream', function(req, res) {
		const {
			exec
		} = require('child_process');
		const cmd = 'ffmpeg -re -i ./videos/mylist.txt -c:v libx264 -preset superfast -tune zerolatency -c:a aac -ar 44100 -f flv rtmp://localhost/live/hello';
		const child = exec(cmd, );
		// use child.stdout.setEncoding('utf8'); if you want text chunks
		child.stdout.on('data', (chunk) => {
			// data from the standard output is here as buffers
			console.log(`child process data ${chunk}`);
		});
		// since these are streams, you can pipe them elsewhere
		// child.stderr.pipe(dest);
		child.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
		});
		res.send('rtmp://localhost/live/hello');
	})

	app.get('/test', function(req, res) {
		// res.send('hello');
		getScript('https://videos-fms.jwpsrv.com/content/conversions/Jx1RPkux/videos/dtT4YJWI-31355306.mp4?token=0_5e88f0be_0x1c8f03cd223f14d03908a82af277e387a9e49ae9')
		.then(ss => {
			console.log('finished download');
		})
		// .error(err => {
		// 	console.log('download error:', err);
		// });
	})

	//===============================================
	// Stream routes ================================
	//===============================================
	app.get('/omgradio/playlist.m3u8', async function (req, res) {
		const path = 'videos/merged.mp4'
		const stat = fs.statSync(path)
		const fileSize = stat.size
		const range = req.headers.range

		if (range) {
			const parts = range.replace(/bytes=/, "").split("-")
			const start = parseInt(parts[0], 10)
			const end = parts[1] ?
				parseInt(parts[1], 10) :
				fileSize - 1

			const chunksize = (end - start) + 1
			const file = fs.createReadStream(path, {
				start,
				end
			})
			const head = {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunksize,
				'Content-Type': 'application/vnd.apple.mpegurl',
			}

			res.writeHead(206, head)
			file.pipe(res)
		} else {
			const head = {
				'Content-Length': fileSize,
				'Content-Type': 'application/vnd.apple.mpegurl',
			}
			res.writeHead(200, head)
			fs.createReadStream(path).pipe(res)
		}
	});

	// app.get('/test', function (req, res) {
	// 	res.render('page/test');
	// })
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/login');
}

function imageFilter(req, file, cb) {
	// Accept images only
	if (!file.originalname.match(/\.(mp4|mkv)$/)) {
		req.fileValidationError = "Invalid file type";
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};

async function mergeFilesAsync(files) {

	return new Promise((resolve, reject) => {

		let cmd = 'rm -f ./videos/mylist.txt ';
		files.forEach(file => {
			cmd += `&& echo file '${file.path}' >> ./videos/mylist.txt `
		});

		// cmd += '&& ffmpeg -y -f concat -safe 0 -i ./videos/mylist.txt -c copy ./videos/merged.mp4'
		const {
			exec
		} = require('child_process');
		const child = exec(cmd, );
		// use child.stdout.setEncoding('utf8'); if you want text chunks
		child.stdout.on('data', (chunk) => {
			// data from the standard output is here as buffers
			console.log(`child process data ${chunk}`);
		});
		// since these are streams, you can pipe them elsewhere
		// child.stderr.pipe(dest);
		child.on('close', (code) => {
			console.log(`child process exited with code ${code}`);
			resolve();
		});
	});
}

function getScript (url) {
    return new Promise((resolve, reject) => {
        const http      = require('http'),
              https     = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
		}
		
		client.get(url, (resp) => {
			let data = '';
			
			resp.pipe(fs.createWriteStream('videos/downloaded.mp4'));

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
};