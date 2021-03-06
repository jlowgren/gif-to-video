const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = process.env.PORT || 8080;

const videosDir = path.join(__dirname, 'public/videos');
const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: uploadDir,
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

app.get('/', (req, res) => {
  fs.readdir(videosDir, (err, files) => {
    if (err) {
      res.render('index', { error: err });
      return;
    }

    const validExtensions = new RegExp('\.(webm|mp4)$', 'i');

    const videos = files
      .filter(file => file.match(validExtensions));

    res.render('index', { files: videos });
  });
});

app.post('/upload', upload.single('file-upload'), (req, res) => {
  const { file } = req;
  const filename = file.filename.split('.')[0];
  const target = path.join(videosDir, `${filename}.mp4`);

  ffmpeg(file.path)
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
