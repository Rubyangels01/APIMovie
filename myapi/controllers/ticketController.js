const { sql, poolPromise } = require('../config/database');
const { query } = require('express');
const jwt = require('jsonwebtoken');
const { DateTime } = require('mssql');
const moment = require('moment');

exports.getRevenueByMovie = async (req, res) =>
    {
        const idmovie = req.params.idMovie;
        try{
            const pool = await poolPromise;
            const result = await pool.request()
            .input('idmovie',sql.Int,idmovie)
            .query('SELECT SUM(CAST(PriceTicket AS INT)) AS TotalPrice FROM TICKETS WHERE  IDMovie = @idmovie;');
            if(result.recordset.length === 0)
                {
                    return res.status(404).json(
                        {
                            code: 404,
                            message: 'Movie not found'
                        }
                    );
                }
                
                const TotalPrice = result.recordset[0].TotalPrice;
                res.status(200).json({
                    code: 200,
                    message:'success',
                    data: 
                    {
                        
                        "TotalPrice":TotalPrice
                    }
                    // Thêm các thông tin khác cần thiết
                });

        }catch(err)
        {
            res.status(500).json({ code:500,
                'message': 'Error retrieving movie' });
        }
    }

    

exports.getTicketCountByMovie = async (req, res) => {
    const idmovie = req.params.idMovie;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idMovie', sql.Int, idmovie)
            .query('SELECT COUNT(*) AS NumberOfTickets FROM TICKETS WHERE IDMovie = @idMovie');

        const numberOfTickets = result.recordset[0].NumberOfTickets;

        res.status(200).json({
            code: 200,
            message: 'success',
            data: { numberOfTickets: numberOfTickets }
        });

    } catch (err) {
        
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie'
        });
    }
};


exports.getNumberTicketAndRevenue = async (req, res) => {
    const idmovie = req.params.idMovie;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idMovie', sql.Int, idmovie)
            .query('SELECT COUNT(*) AS NumberTicket,SUM(CAST(t.PriceTicket AS DECIMAL(10, 2))) AS TotalRevenue FROM TICKETS t INNER JOIN SCHEDULESHOW s ON t.IDScheduleShow = s.IDSchedule WHERE s.IDMovie = @idMovie;');

        const NumberTicket = result.recordset[0].NumberTicket; 
        const TotalRevenue = result.recordset[0].TotalRevenue;

        res.status(200).json({
            code: 200,
            message: 'success',
            data: { "NumberTicket":NumberTicket,
                "TotalRevenue":TotalRevenue
             }
        });

    } catch (err) {
        
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie'
        });
    }
};


exports.getShowDateOfMovie = async (req, res) => {
    const idmovie = req.params.idMovie;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idMovie', sql.Int, idmovie)
            .query('SELECT DISTINCT CAST(s.ShowDate AS DATE) AS dateShow FROM SCHEDULESHOW s WHERE s.IDMovie = @idMovie  AND s.ShowDate > GETDATE();');

        
        const dateShow = result.recordset;

        res.status(200).json({
            code: 200,
            message: 'success',
            data: { 
                dateShow
             }
        });
        

    } catch (err) {
        
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie'
        });
    }
};

exports.getHourShowOfDate = async (req, res) => {
    const idmovie = req.query.idMovie;
    const showDate = req.query.showDate;
    const idTheater = req.query.idTheater;

    

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idMovie', sql.Int, idmovie)
            .input('showDate', sql.Date, showDate)
            .input('idTheater',sql.Int,idTheater)
            .query(`
                SELECT DISTINCT
                RIGHT('0' + CAST(DATEPART(HOUR, ShowDate) AS VARCHAR), 2) + ':' +
                RIGHT('0' + CAST(DATEPART(MINUTE, ShowDate) AS VARCHAR), 2) AS TimeOnly
            FROM SCHEDULESHOW
            join DETAILMANAGER on SCHEDULESHOW.IDManager = DETAILMANAGER.IDManager
            WHERE IDMovie = @idMovie
            AND CAST(ShowDate AS DATE) = @showDate
            AND DETAILMANAGER.IDTheater = @idTheater;
            `);

        

        const dateShow = result.recordset.map(record => record.TimeOnly);

        res.status(200).json({
            code: 200,
            message: 'success',
            data: { 
                dateShow
            }
        });

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message
        });
    }
};

exports.getTheatersShowAndhourShow = async (req, res) => {
    const idmovie = req.params.idMovie;
    const showDate = req.query.showDate;

    try {
        const pool = await poolPromise;
        

        // Truy vấn lấy danh sách các rạp chiếu phim duy nhất
        const theaterResult = await pool.request()
            .input('idMovie', sql.Int, idmovie)
            .input('showDate', sql.DateTime, showDate)
            .query(`
                SELECT DISTINCT THEATERS.NAMETHEATER, THEATERS.IDTHEATER, THEATERS.ADDRESS
                FROM THEATERS
                JOIN ROOMS ON THEATERS.IDTheater = ROOMS.IDTHEATER
                JOIN SCHEDULESHOW ON ROOMS.IDRoom = SCHEDULESHOW.IDRoom
                WHERE SCHEDULESHOW.IDMovie = @idMovie 
                AND CAST(SCHEDULESHOW.ShowDate AS DATE) = @showDate;
                
            `);

        const theaters = theaterResult.recordset;

        // Truy vấn lấy giờ chiếu phim của mỗi rạp chiếu phim
        for (let theater of theaters) {
            const showtimeResult = await pool.request()
                .input('idMovie', sql.Int, idmovie)
                .input('showDate', sql.DateTime, showDate)
                .input('idTheater', sql.Int, theater.IDTHEATER)
                .query(`
                    SELECT DISTINCT
                    RIGHT('0' + CAST(DATEPART(HOUR, ShowDate) AS VARCHAR), 2) + ':' +
                    RIGHT('0' + CAST(DATEPART(MINUTE, ShowDate) AS VARCHAR), 2) AS TimeOnly
                    FROM SCHEDULESHOW
                    JOIN DETAILMANAGER ON SCHEDULESHOW.IDManager = DETAILMANAGER.IDManager
                    WHERE IDMovie = @idMovie
                    AND CAST(ShowDate AS DATE) = @showDate
                    AND DETAILMANAGER.IDTheater = @idTheater
                    AND ShowDate >= GetDate();
                `);

            // Thêm giờ chiếu vào thông tin của rạp chiếu phim
            theater.showtimes = showtimeResult.recordset.map(record => record.TimeOnly);
        }

        res.status(200).json({
            code: 200,
            message: 'success',
            data: theaters
        });

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message
        });
    }
};

exports.updateChair = async (req, res) => {
    const idRoom = req.params.idRoom;
    const idChair = req.params.idChair; // Đảm bảo rằng bạn đang truyền đúng tên tham số

    try {
        const pool = await poolPromise;

        // Nếu có sự thay đổi thì trả về, còn nếu không có sự thay đổi (dữ liệu vẫn như cũ) thì trả về 0
        const updateResult = await pool.request()
            .input('idRoom', sql.Int, idRoom)
            .input('idChair', sql.Int, idChair)
            .query(`
                UPDATE DETAILCHAIR SET Status = 1 where IDRoom = @idRoom and IDChair = @idChair
            `);
            res.status(200).json({
                code: 200,
                message: 'No changes made',
                

            });
       

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

// hôm nay đã hoàn thành xong form đến thanh toán
// ngày mai hiển thị room lên
// và thực hiện cập nhật ghế khi khách hàng chọn ghế
// đồng thời phải thêm một hàm cập nhật về 0



exports.getRoomBySchedule = async (req, res) => {
    const idMovie = req.params.idMovie;
    let showDate = req.query.showDate;
    const idTheater = req.query.idTheater;

    // Kiểm tra xem các tham số có giá trị không
    if (!idMovie || !showDate || !idTheater) {
        return res.status(400).json({
            code: 400,
            message: 'Missing required query parameters',
        });
    }

    // Chuyển đổi showDate thành định dạng chuẩn
    //const showDateFormatted = moment(showDate).format('YYYY-MM-DD HH:mm:ss');

    try {
        

        const pool = await poolPromise;
        const result = await pool.request()
            .input('idMovie', sql.Int, idMovie)
            .input('showDate', sql.VarChar, showDate)
            .input('idTheater', sql.Int, idTheater)
            .query(`
                SELECT rooms.IDRoom, NameRoom, IDTheater
                FROM rooms 
                INNER JOIN SCHEDULESHOW ON ROOMS.IDRoom = SCHEDULESHOW.IDRoom 
                WHERE ROOMS.IDTHEATER = @idTheater 
                
              AND CAST(SCHEDULESHOW.ShowDate AS DATE) = CAST(CONVERT(DATE, @showDate, 120) AS DATE)
        AND CAST(SCHEDULESHOW.ShowDate AS TIME) = CAST(CONVERT(TIME, @showDate, 120) AS TIME)
                AND SCHEDULESHOW.IDMovie = @idMovie
            `);

        

        if (result.recordset.length === 0) {
            res.status(404).json({
                code: 404,
                message: 'No rooms found for the specified schedule',
            });
        } else {
            res.status(200).json({
                code: 200,
                message: 'success',
                data: result.recordset,
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message,
        });
    }
};


exports.GetTicketByIDUser = async (req, res) => {
    const idUser = req.params.idUser;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idUser', sql.Int, idUser) // Đảm bảo sử dụng tham số 'idUser' cho truy vấn
            .query(`
                SELECT DISTINCT
                    
                    P.NAMEMOVIE ,
                    LC.ShowDate ,
                    HD.Total ,
                    V.IDBill ,
                    HD.Payment ,
					R.NAMETHEATER,
					PH.NameRoom
                FROM 
                    TICKETS V
                    INNER JOIN BILL HD ON V.IDBill = HD.IDBill
                    INNER JOIN CUSTOMERS KH ON HD.IDUser = KH.IDCustomer
                    INNER JOIN SCHEDULESHOW LC ON V.IDSchedule = LC.IDSchedule
                    INNER JOIN MOVIE P ON LC.IDMovie = P.IDMOVIE
					INNER JOIN ROOMS PH ON LC.IDRoom = PH.IDRoom
					INNER JOIN THEATERS R ON PH.IDTheater = R.IDTheater
                WHERE 
                    KH.IDCustomer = @idUser and showDate >= GetDate();
            `);

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error(err); // In lỗi ra console để dễ dàng debug
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};


exports.GetOrderedByIDUser = async (req, res) => {
    const idUser = req.params.idUser;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idUser', sql.Int, idUser) // Đảm bảo sử dụng tham số 'idUser' cho truy vấn
            .query(`
                SELECT DISTINCT
                    P.NAMEMOVIE ,
                    LC.ShowDate ,
                    HD.Total ,
                    V.IDBill ,
                    HD.Payment ,
					R.NAMETHEATER,
					PH.NameRoom
                FROM 
                    TICKETS V
                    INNER JOIN BILL HD ON V.IDBill = HD.IDBill
                    INNER JOIN CUSTOMERS KH ON HD.IDUser = KH.IDCustomer
                    INNER JOIN SCHEDULESHOW LC ON V.IDSchedule = LC.IDSchedule
                    INNER JOIN MOVIE P ON LC.IDMovie = P.IDMOVIE
					INNER JOIN ROOMS PH ON LC.IDRoom = PH.IDRoom
					INNER JOIN THEATERS R ON PH.IDTheater = R.IDTheater
                WHERE 
                    KH.IDCustomer = @idUser and CAST(LC.ShowDate as Date) <= GetDate();
            `);

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error(err); // In lỗi ra console để dễ dàng debug
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

exports.GetChairByIDBill = async (req, res) => {
    const idBill = req.params.idBill;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idBill', sql.Int, idBill) // Đảm bảo sử dụng tham số 'idUser' cho truy vấn
            .query(`
                SELECT 
    
    G.IDChair ,G.NameChair
FROM 
    BILL HD
    INNER JOIN TICKETS V ON HD.IDBill = V.IDBill
    INNER JOIN DETAILCHAIR CTG ON V.IDCTChair = CTG.IDCTChair
    INNER JOIN CHAIRS G ON CTG.IDChair = G.IDChair
WHERE 
    HD.IDBill = @idBill;
            `);

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error(err); // In lỗi ra console để dễ dàng debug
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

exports.GetRoomByIDBill = async (req, res) => {
    const idBill = req.params.idBill;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idBill', sql.Int, idBill) // Đảm bảo sử dụng tham số 'idUser' cho truy vấn
            .query(`
                SELECT 
    DISTINCT P.IDRoom,P.NameRoom AS RoomName
FROM 
    BILL HD
    INNER JOIN TICKETS V ON HD.IDBill = V.IDBill
    INNER JOIN SCHEDULESHOW LC ON V.IDSchedule = LC.IDSchedule
    INNER JOIN ROOMS P ON LC.IDRoom = P.IDRoom
WHERE 
    HD.IDBill = @idBill;
            `);

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error(err); // In lỗi ra console để dễ dàng debug
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};





// const transaction = new sql.Transaction(pool);
//         await transaction.begin();

//         const request = new sql.Request(transaction);
//         for (let i = 0; i < schedules.length; i++) {
//             await request.input('idmovie', sql.Int, idmovie)
//                 .input('showTime', sql.Time, schedules[i])
//                 .query('INSERT INTO SCHEDULES (IDMovie, ShowTime) VALUES (@idMovie, @showTime)');
//         }
//await transaction.commit();