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

router.get('/movie/:idMovie/room', ticketController.getRoomBySchedule);
router.get('/customer/:idUser', ticketController.GetTicketByIDUser);
router.get('/customer/billrefund/:idUser', ticketController.GetTicketCancelByIDUser);
router.get('/customer/:IDCustomer/bill/:idBill', ticketController.GetTicketByIDUserAndBill);
router.get('/promotion/:idPromotion', ticketController.GetPromotionByID);
router.get('/customer/:idUser/ordered', ticketController.GetOrderedByIDUser);
router.get('/chair/bill/:idBill', ticketController.GetChairByIDBill);
router.get('/room/bill/:idBill', ticketController.GetRoomByIDBill);
router.post('/ticket/save', ticketController.createBillAndTicket);
router.get('/chairs/room/:idRoom',ticketController.getAllChair);
router.post('/ticket/customer/:IDCustomer',ticketController.saveBill);
router.get('/revenue/movie/:IDMovie/theater/:IDTheater', ticketController.GetRevenue);
router.get('/revenue/theater/:IDTheater', ticketController.GetAllRevenue);
router.get('/revenue/theater/:IDTheater/showdate', ticketController.GetAllRevenueByDate);
router.get('/revenue/movie/:idMovie', ticketController.GetAllRevenueOfMovie);
router.get('/room/showing/theater/:IDTheater', ticketController.GetAllRoomCurrentShowing);
router.post('/chair/:idChair/room/:idRoom', ticketController.updateChair);
router.delete('/chair/:idChair/room/:idRoom', ticketController.deteleStatusChair);
router.get('/movie/:idMovie/room/:idRoom', ticketController.GetTicketByMovieAndShowDate);
router.get('/promotions/:idPromotion',ticketController.getVouchertoCondition);
router.put('/bill_update/:idBill',ticketController.updateBill);
router.get('/timerefund/bills/:idBill',ticketController.GetTimeRefund);





module.exports = router;



