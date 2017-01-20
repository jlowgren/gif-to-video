const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const junk = require('junk');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = process.env.PORT || 8080;

const destination = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination,
  filename(req, file, cb) {
    crypto.pseudoRandomBytes(16, (err, raw) => {
      if (err) return cb(err);
      const name = `${raw.toString('hex')}${path.extname(file.originalname)}`
      cb(null, name);
    });
  }
});
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('uploads'));

app.get('/', (req, res) => {
  fs.readdir(destination, (err, files) => {
    const videos = files
      .filter(file => path.extname(file) === '.mp4')
      .filter(junk.not);

    res.render('index', { files: videos });
  });
});

app.post('/upload', upload.single('file-upload'), (req, res) => {
  const { file } = req;
  const target = path.join(destination, `${path.basename(file.filename)}.mp4`);
  ffmpeg(req.file.path)
    .outputOptions([
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
    ])
    .on('end', () => res.redirect('back'))
    .on('error', err => res.render('index', { error: err }))
    .save(target);
});

app.listen(port, () => console.log(`Listening on port ${port}`));
