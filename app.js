const express = require('express');
const app = express();
var path = require('path');
const fs = require('fs');
const multer = require('multer');
const { TesseractWorker} = require('tesseract.js');
const worker = new TesseractWorker();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        cb(null,  file.originalname)
    }
});

const upload = multer({
    storage: storage,
    limits: {fileSize:1000000},
    fileFilter: function(req, file, cb) {
        checkType(file, cb)
    }
}).single("avatar");

function checkType(file, cb) {
    const fileType = /jpeg|jpg|png/;
    const extname = fileType.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileType.test(file.mimetype);

    if(mimetype && extname) {
        return cb(null, true);
    }else {
        cb('Error: Images Only!')
    }
}
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
    res.render('index')
})

app.post("/uploads",(req,res) => {
    upload(req,res, (err) =>{
     if(err) {
    res.render('index', {
        msg: err
    });
     } else {
        fs.readFile(`./uploads/${req.file.originalname}`, (err, data) => {
            if(err) return console.log(`Error`, err)
            worker.recognize(data, "eng", { tessjs_create_pdf:"1"})
            .progress(progress => {
                console.log(progress)
            })
            .then(result => {
                /* res.send(result.text); */
                res.redirect("/download")
            })
            .finally(()=>worker.terminate());
        } )
     }
        
    })
})
app.get("/download", (req, res ) => {
    const file = `${__dirname}/tesseract.js-ocr-result.pdf`
    res.download(file)
})
const PORT = 3000 || process.env.PORT;
app.listen(PORT, console.log(`Running on ${PORT}`))