const { sql } = require('../config/database');
const { query } = require('express');
const jwt = require('jsonwebtoken');
const { DateTime } = require('mssql');
const moment = require('moment');

exports.getRevenueByMovie = async (req, res) =>
    {
        const idmovie = req.params.idMovie;
        try{
            const pool = await req.poolPromise;
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
        const pool = await req.poolPromise;
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
        const pool = await req.poolPromise;
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
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('idMovie', sql.Int, idmovie)
            .query('SELECT DISTINCT CAST(s.ShowDate AS DATE) AS dateShow FROM SCHEDULESHOW s WHERE s.IDMovie = @idMovie AND s.ShowDate > GETDATE();');

        
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
        const pool = await req.poolPromise;
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
        const pool = await req.poolPromise;
        

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
        

        const pool = await req.poolPromise;
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
        const pool = await req.poolPromise;
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
                    INNER JOIN BILLS HD ON V.IDBill = HD.IDBill
                    INNER JOIN CUSTOMERS KH ON HD.IDCustomer = KH.IDCustomer
                    INNER JOIN SCHEDULESHOW LC ON V.IDSchedule = LC.IDSchedule
                    INNER JOIN MOVIE P ON LC.IDMovie = P.IDMOVIE
					INNER JOIN ROOMS PH ON LC.IDRoom = PH.IDRoom
					INNER JOIN THEATERS R ON PH.IDTheater = R.IDTheater
                WHERE 
                    KH.IDCustomer = @idUser AND HD.TimeRefund IS NULL;
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

exports.GetTicketCancelByIDUser = async (req, res) => {
    const idUser = req.params.idUser;

    try {
        const pool = await req.poolPromise;
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
                    INNER JOIN BILLS HD ON V.IDBill = HD.IDBill
                    INNER JOIN CUSTOMERS KH ON HD.IDCustomer = KH.IDCustomer
                    INNER JOIN SCHEDULESHOW LC ON V.IDSchedule = LC.IDSchedule
                    INNER JOIN MOVIE P ON LC.IDMovie = P.IDMOVIE
					INNER JOIN ROOMS PH ON LC.IDRoom = PH.IDRoom
					INNER JOIN THEATERS R ON PH.IDTheater = R.IDTheater
                WHERE 
                    KH.IDCustomer = @idUser AND HD.TimeRefund IS NOT NULL;
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
// Get promotion by idpromotion
exports.GetPromotionByID = async (req, res) => {
    const idPromotion = req.params.idPromotion;

    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('idPromotion', sql.Int, idPromotion) // Đảm bảo sử dụng tham số 'idUser' cho truy vấn
            .query(`
                Select * from PROMOTION where IDPromotion = @idPromotion
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
exports.GetTicketByIDUserAndBill = async (req, res) => {
    const IDCustomer = req.params.IDCustomer;
    const idBill = req.params.idBill;

    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('IDCustomer', sql.Int, IDCustomer) 
            .input('idBill', sql.Int, idBill)// Đảm bảo sử dụng tham số 'idUser' cho truy vấn
            .query(`
                EXEC GetTicketDetails @IDBill =@idBill , @IDCustomer =@IDCustomer;
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

exports.GetTicketByMovieAndShowDate = async (req, res) => {
    const idMovie = req.params.idMovie;
    const idRoom = req.params.idRoom;
    const showdate = req.query.showdate;
    try {
        const pool = await req.poolPromise;
        const date = moment(showdate, 'YYYY-MM-DDTHH:mm:ss');
            
        if (!date.isValid()) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid StartTime format'
            });
        }

        // Định dạng lại ngày giờ
        const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
        const result = await pool.request()
            .input('IDMovie', sql.Int, idMovie) 
            .input('IDRoom', sql.Int, idRoom) 
            .input('ShowDate', sql.VarChar, formattedDate) 
            
            .query(`
                EXEC GetTicketsByMovieAndShowDate @IDMovie,@IDRoom,@ShowDate;
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

// Lấy tất cả các voucher mà người dùng đủ điều kiện để áp dụng
// Nếu số tiền bill bằng hoặc lớn hơn số tiền đáp ứng điều kiện thì sẽ lấy ra các voucher đó

exports.getVouchertoCondition = async (req, res) => {
    const totalBill = req.query.totalBill;
    const idCustomer = req.params.idCustomer;
    
    try {
        const pool = await req.poolPromise;
       // const date = moment(showdate, 'YYYY-MM-DDTHH:mm:ss');
            
        // if (!date.isValid()) {
        //     return res.status(400).json({
        //         code: 400,
        //         message: 'Invalid StartTime format'
        //     });
        // }

        // Định dạng lại ngày giờ
        //const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
        const result = await pool.request()
            .input('totalBill', sql.VarChar, totalBill) 
            .input('idCustomer',sql.Int,idCustomer)
            .query(`
                SELECT * 
FROM PROMOTION P
WHERE 
    @toTalBill >= P.ToTalBill
    AND GETDATE() >= P.StartDate
    AND GETDATE() <= P.EndDate
    AND NOT EXISTS (
        SELECT 1 
        FROM BILLS B 
        WHERE B.IDPromotion = P.IDPromotion
          AND B.IDCustomer = @idCustomer
    );

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
        const pool = await req.poolPromise;
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
        const pool = await req.poolPromise;
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
        const pool = await req.poolPromise;
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




exports.createBillAndTicket = async (req, res) => {
    const { IDBill, IDRoom, IDMovie, ShowDate, listIDChair } = req.body;

    try {
        const pool = await req.poolPromise;

        // Kiểm tra nếu bất kỳ tham số nào là null hoặc undefined
        if (!IDBill || !IDRoom || !IDMovie || !ShowDate || !listIDChair || listIDChair.length === 0) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid input data'
            });
        }

        const date = moment(ShowDate, 'YYYY-MM-DDTHH:mm:ss');
            
        if (!date.isValid()) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid StartTime format'
            });
        }

        // Định dạng lại ngày giờ
        const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        for (const idChair of listIDChair) {
            await transaction.request()
                .input('IDBill', sql.Int, IDBill)
                .input('IDRoom', sql.Int, IDRoom)
                .input('IDChair', sql.Int, idChair)
                .input('IDMovie', sql.Int, IDMovie)
                .input('ShowDate', sql.VarChar, formattedDate) // Sử dụng biến đã chuyển đổi
                .query('EXEC AddVeAndHoaDon @IDBill, @IDRoom, @IDChair, @IDMovie, @ShowDate');
        }

        await transaction.commit();

        res.status(201).json({
            code: 201,
            message: 'Tickets added successfully'
        });

    } catch (err) {
        console.error(err); // Ghi log lỗi
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

exports.updateChair = async (req, res) => {
    const idChair = req.params.idChair;
    const idRoom = req.params.idRoom;
    const showDate = req.query.showDate; 
    
    try {
        const pool = await req.poolPromise;
        const date = moment(showDate, 'YYYY-MM-DDTHH:mm:ss');
            
        if (!date.isValid()) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid StartTime format'
            });
        }

        // Định dạng lại ngày giờ
        const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
        // Thực hiện cập nhật và kiểm tra số lượng bản ghi bị ảnh hưởng
        const result = await pool.request()
            .input('IDChair', sql.Int, idChair)
            .input('IDRoom', sql.Int, idRoom)
            .input('ShowDate', sql.VarChar, formattedDate)
            .query(`
                EXEC InsertSeatStatus @ShowDate,@IDChair,@IDRoom
            `);

        // Kiểm tra số lượng bản ghi bị ảnh hưởng
        if (result.rowsAffected[0] > 0) {
            res.status(201).json({
                code: 201,
                message: 'Update successful',
                data: 1
            });
        } else {
            res.status(404).json({
                code: 404,
                message: 'No record found to update',
                data: 0
            });
        }

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

exports.deteleStatusChair = async (req, res) => {
    const idChair = req.params.idChair;
    const idRoom = req.params.idRoom;
    const showDate = req.query.showDate; 
    
    try {
        const pool = await req.poolPromise;
        const date = moment(showDate, 'YYYY-MM-DDTHH:mm:ss');
            
        if (!date.isValid()) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid StartTime format'
            });
        }

        // Định dạng lại ngày giờ
        const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
        // Thực hiện cập nhật và kiểm tra số lượng bản ghi bị ảnh hưởng
        const result = await pool.request()
            .input('IDChair', sql.Int, idChair)
            .input('IDRoom', sql.Int, idRoom)
            .input('ShowDate', sql.VarChar, formattedDate)
            .query(`
                EXEC DeleteSeatStatus @ShowDate,@IDChair,@IDRoom
            `);

        // Kiểm tra số lượng bản ghi bị ảnh hưởng
        if (result.rowsAffected[0] > 0) {
            res.status(201).json({
                code: 201,
                message: 'Delate successful',
                data: 1
            });
        } else {
            res.status(404).json({
                code: 404,
                message: 'No record found to update',
                data: 0
            });
        }

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};
exports.getAllChair = async (req, res) => {
    const idRoom = req.params.idRoom;
    const showDate = req.query.showDate;
 
    try {
        
        const pool = await req.poolPromise;
        const date = moment(showDate, 'YYYY-MM-DDTHH:mm:ss');
            
        if (!date.isValid()) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid StartTime format'
            });
        }

        // Định dạng lại ngày giờ
        const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
        const result = await pool.request()
            .input("IDRoom", sql.Int,idRoom)
            .input("ShowDate",sql.VarChar,formattedDate)
            .query('EXEC GetChairsStatusByRoom @IDRoom,@ShowDate');

        
        

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
        

    } catch (err) {
        
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie'
        });
    }
};

exports.saveBill = async (req, res) => {
    const IDCustomer = req.params.IDCustomer;
    const { Payment, Total, IDPromotion } = req.body;
    
    try {
        const pool = await req.poolPromise;
        
        const insertResult = await pool.request()
            .input('IDCustomer', sql.Int, IDCustomer)
            .input('Payment', sql.NVarChar, Payment)
            .input('Total', sql.VarChar, Total)
            .input('IDPromotion', sql.Int, IDPromotion || null)  // Set IDPromotion to null if not provided
            .query('INSERT INTO BILLS (IDCustomer, Payment, Total, IDPromotion) OUTPUT INSERTED.* VALUES (@IDCustomer, @Payment, @Total, @IDPromotion)');

        res.status(201).json({
            code: 201,
            message: 'success',
            data: insertResult.recordset[0]
        });

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};



exports.GetRevenue = async (req, res) => {
    const IDMovie = req.params.IDMovie;
    const IDTheater  =req.params.IDTheater;
     try {
         const pool = await req.poolPromise;
         const result = await pool.request()
         .input("IDMovie",sql.Int,IDMovie)
         .input("IDTheater",sql.Int,IDTheater)
         .query('EXEC GetMovieStatistics @IDMovie,@IDTheater');
         res.status(200).json(
             {
                 code:200,
                 message:'success',
                 data: result.recordset
             }
         );
     } catch (err) {
         res.status(500).json({ message: err.message });
     }
 };
 exports.GetAllRevenue = async (req, res) => {
    const IDTheater  =req.params.IDTheater;
     try {
         const pool = await req.poolPromise;
         const result = await pool.request()
         .input("IDTheater",sql.Int,IDTheater)
         .query('EXEC GetAllRevenuOfMovie @IDTheater');
         res.status(200).json(
             {
                 code:200,
                 message:'success',
                 data: result.recordset
             }
         );
     } catch (err) {
         res.status(500).json({ message: err.message });
     }
 };

 exports.GetAllRevenueByDate = async (req, res) => {
    const IDTheater  =req.params.IDTheater;
    const ShowDate = req.query.ShowDate;
     try {
         const pool = await req.poolPromise;
         const result = await pool.request()
         .input("IDTheater",sql.Int,IDTheater)
         .input("ShowDate", sql.Date,ShowDate)
         .query('EXEC GetAllRevenuOfMovieByDate @IDTheater,@ShowDate');
         res.status(200).json(
             {
                 code:200,
                 message:'success',
                 data: result.recordset
             }
         );
     } catch (err) {
         res.status(500).json({ message: err.message });
     }
 };
 exports.GetAllRevenueOfMovie = async (req, res) => {
    const idMovie  =req.params.idMovie;
     try {
         const pool = await req.poolPromise;
         const result = await pool.request()
         .input("IDMovie",sql.Int,idMovie)
         .query('EXEC GetAllMovieStatistics @IDMovie');
         res.status(200).json(
             {
                 code:200,
                 message:'success',
                 data: result.recordset
             }
         );
     } catch (err) {
         res.status(500).json({ message: err.message });
     }
 };

 exports.GetAllRoomCurrentShowing = async (req, res) => {
    const IDTheater  =req.params.IDTheater;
     try {
         const pool = await req.poolPromise;
         const result = await pool.request()
         .input("IDTheater",sql.Int,IDTheater)
         .query('EXEC GetCurrentMoviesSchedule @IDTheater');
         res.status(200).json(
             {
                 code:200,
                 message:'success',
                 data: result.recordset
             }
         );
     } catch (err) {
         res.status(500).json({ message: err.message });
     }
 };

 

 exports.updateBill = async (req, res) => {
    const timeRefund  = req.query.timeRefund;
    const idBill = req.params.idBill; // Đảm bảo rằng bạn đang truyền đúng tên tham số

    try {
        const pool = await req.poolPromise;
        const date = moment(timeRefund, 'YYYY-MM-DDTHH:mm:ss');
        console.log(timeRefund);
            
        if (!date.isValid()) {
            return res.status(400).json({
                code: 400,
                message: 'Invalid StartTime format'
            });
        }

        // Định dạng lại ngày giờ
        const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
        // Nếu có sự thay đổi thì trả về, còn nếu không có sự thay đổi (dữ liệu vẫn như cũ) thì trả về 0
        const updateResult = await pool.request()
            .input('timeRefund', sql.VarChar, formattedDate)
            .input('idBill',sql.Int,idBill)
            .query(`
                UPDATE BILLS SET TimeRefund = @timeRefund
                WHERE IDBill = @idBill;
                SELECT @@ROWCOUNT AS affectedRows;
            `);

        const affectedRows = updateResult.recordset[0].affectedRows;

        if (affectedRows === 0) {
            res.status(200).json({
                code: 200,
                message: 'Update failed',
                data: {
                    
                }

            });
        } else {
            

            res.status(200).json({
                code: 200,
                message: 'Update successful',
                data: {
                    
                }
            });
        }

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

exports.GetTimeRefund = async (req, res) => {
    const IDBill  =req.params.idBill;
     try {
         const pool = await req.poolPromise;
         const result = await pool.request()
         .input("IDBill",sql.Int,IDBill)
         .query('select timeRefund from bills where idbill = @IDBill');
         res.status(200).json(
             {
                 code:200,
                 message:'success',
                 data: result.recordset
             }
         );
     } catch (err) {
         res.status(500).json({ message: err.message });
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
