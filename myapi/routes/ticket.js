const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');


router.get('/movie/:idMovie/revenue', ticketController.getRevenueByMovie);
router.get('/movie/:idMovie',ticketController.getTicketCountByMovie);// database cũ, xoá
// lấy danh sách giờ sẽ hiển thị theo cho từng movie
router.get('/ticket/:idMovie', ticketController.getNumberTicketAndRevenue);
router.get('/showdate/movie/:idMovie',ticketController.getShowDateOfMovie);
router.get('/hourshow/movie',ticketController.getHourShowOfDate);
router.get('/theaters/movie/:idMovie',ticketController.getTheatersShowAndhourShow);
router.put('/chair/:idChair/room/:idRoom',ticketController.updateChair);
router.get('/movie/:idMovie/room', ticketController.getRoomBySchedule);
router.get('/customer/:idUser', ticketController.GetTicketByIDUser);
router.get('/customer/:idUser/ordered', ticketController.GetOrderedByIDUser);
router.get('/chair/bill/:idBill', ticketController.GetChairByIDBill);
router.get('/room/bill/:idBill', ticketController.GetRoomByIDBill);





module.exports = router;



