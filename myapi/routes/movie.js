const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');




router.get('/listmovie', movieController.getAllMovies);
router.get('/listmovie/upcoming', movieController.GetUpcomingMovies);
router.get('/theaters', movieController.getAllTheater);
router.get('/theater/:idTheater', movieController.getAllMovieByTheater);
router.get('/movie/namemovie', movieController.getMovieByNameMovie);
router.get('/ticket/movie/:idMovie', movieController.getTicketMovie);
router.get('/schedule/theater/:idTheater', movieController.getMovieScheduleByTheaterandDate);
router.get('/showtime/theater/:idTheater', movieController.getShowtimeOfMovie);
router.get('/movie/:id', movieController.getMovieByID);
router.put('/movie/:idMovie', movieController.updateStatusMovie);
router.get('/type/movie/:id', movieController.getTypeMovie);
router.get('/rooms/theater/:idTheater/movie', movieController.getRoomNotHaveMovieByIDTheater);
router.post('/schedule/theater',movieController.createSchedule);
router.post('/voucher', movieController.createVoucher);

const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/imagetheater/'); // Thư mục lưu trữ ảnh
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên tệp để tránh xung đột
    }
});

const upload1 = multer({ storage: storage1 });
router.post('/theater',upload1.single('image'), movieController.createTheater);
router.get('/theaters',movieController.getAllTheater);
router.post('/theater/:idtheater/room', movieController.createRoom);
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Thư mục lưu trữ ảnh
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Đổi tên tệp để tránh xung đột
    }
});

const upload = multer({ storage: storage });
router.post('/movie', upload.single('image'), movieController.createMovie);

router.put('/room/:idRoom', movieController.updateRoom);

router.get('/rooms/theaters/:idTheater', movieController.getallRoomByTheater);

router.post('/movie/schedule', movieController.GetDataIntemp);
router.get('/movie/:idMovie/schedules', movieController.getSchedules);

router.delete('/temp', movieController.DeleteTemp);
router.post('/movie/schedule/temp', movieController.createScheduleIntemp);

module.exports = router;
