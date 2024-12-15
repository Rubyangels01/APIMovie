
const { sql } = require('../config/database');
const { query } = require('express');
const Promotion = require('../models/Promotion');

const jwt = require('jsonwebtoken');

exports.getAllMovies = async (req, res) => {
    try {
        const pool = await req.poolPromise;
        const result = await pool.request().query('EXEC GetMoviesWithMostTickets');
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
exports.GetUpcomingMovies = async (req, res) => {
    try {
        const pool = await req.poolPromise;
        const result = await pool.request().query('EXEC GetUpcomingMovies');
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


exports.getMovieByID = async (req, res) =>
    {
        const idMovie = req.params.id;
        try{
            const pool = await req.poolPromise;
            const result = await pool.request()
            .input('idMovie',sql.Int,idMovie)
            .query('SELECT * FROM MOVIE WHERE IDMOVIE = @idMovie');
            if(result.recordset.length === 0)
                {
                    return res.status(404).json(
                        {
                            code: 404,
                            message: 'Movie not found'
                        }
                    );
                }
                const movie = result.recordset[0];
                res.status(200).json({
                    code: 200,
                    message:'success',
                    data: movie
                    // Thêm các thông tin khác cần thiết
                });

        }catch(err)
        {
            res.status(500).json({ code:500,
                message: 'Error retrieving movie' });
        }
    }



    exports.createTheater = async (req, res) => {
        const { nametheater, address } = req.body;
        const image = req.file ? req.file.path : null;
        
        if (!image) {
            return res.status(400).json({
                code: 400,
                message: 'Image is required'
            });
        }
        try {
            const pool = await req.poolPromise;
            const imageUrl = `http://192.168.1.186:3002/${image.replace(/\\/g, '/')}`;
           
    
            const insertResult = await pool.request()
                .input('nametheater', sql.NVarChar, nametheater)
                .input('address', sql.NVarChar, address)
                .input('image',sql.VarChar,imageUrl)
                .query('INSERT INTO THEATERS (nametheater,image, address) OUTPUT INSERTED.* VALUES (@nametheater,@image, @address)');
    
                
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

    exports.getAllTheater = async (req, res) =>
        {
            
            try{
                const pool = await req.poolPromise;
                const result = await pool.request()
                
                .query('SELECT * FROM THEATERS');
                
                    const theater = result.recordset;
                    res.status(200).json({
                        code: 200,
                        message:'success',
                        data: theater
                        // Thêm các thông tin khác cần thiết
                    });
    
            }catch(err)
            {
                res.status(500).json({ code:500,
                    message: 'Error retrieving theater' });
            }
        }

        
        exports.getAllMovieByTheater = async (req, res) =>
            {
                const idTheater = req.params.idTheater
                
                try{
                    const pool = await req.poolPromise;
                    const result = await pool.request()
                    .input("IDTheater",sql.Int,idTheater)
                    .query('EXEC GetMoviesByTheater @IDTheater');
                    
                        const theater = result.recordset;
                        res.status(200).json({
                            code: 200,
                            message:'success',
                            data: theater
                            // Thêm các thông tin khác cần thiết
                        });
        
                }catch(err)
                {
                    res.status(500).json({ code:500,
                        message: 'Error retrieving theater' });
                }
            }

    exports.createRoom = async (req, res) => {
        const { nameroom } = req.body;
        const idTheater = req.params.idtheater;
    
        try {
            const pool = await req.poolPromise;
    
            if (idTheater == null) {
                return res.status(400).json({
                    code: 400,
                    message: 'IDTheater is null'
                });
            }
    
            const insertResult = await pool.request()
                .input('nameroom', sql.NVarChar, nameroom)
                .input('idtheater', sql.VarChar, idTheater)
                .query('INSERT INTO ROOMS (nameroom, idtheater) OUTPUT INSERTED.* VALUES (@nameroom, @idtheater)');
    
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

    exports.createVoucher = async (req, res) => {
        const promotionData = new Promotion(req.body);
    
    
        try {
            const pool = await req.poolPromise;
            const insertResult = await pool.request()
                .input('namePromotion', sql.NVarChar, promotionData.namePromotion)
                .input('percentSell', sql.Int, promotionData.percentSell)
                .input('totalBill', sql.VarChar, promotionData.totalBill)
                .input('description', sql.NVarChar, promotionData.description)
                .input('startDate', sql.Date, promotionData.startDate)
                .input('endDate', sql.Date, promotionData.endDate)
                .query('INSERT INTO PROMOTION (NamePromotion, StartDate, EndDate, PercentSell, Descriptiom,TotalBill) OUTPUT INSERTED.* VALUES (@namePromotion,@startDate,@endDate,@percentSell,@description,@totalBill)');
    
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
    
    exports.createMovie = async (req, res) => {
        const { namemovie, time, description, releaseddate, language, cast, price, status, idType } = req.body;
        const image = req.file ? req.file.path : null;
    
        if (!image) {
            return res.status(400).json({
                code: 400,
                message: 'Image is required'
            });
        }
    
        const imageUrl = `http://192.168.1.203:3002/${image.replace(/\\/g, '/')}`;
    
        let transaction; // Định nghĩa biến transaction bên ngoài khối try
    
        try {
            const pool = await req.poolPromise;
            
            // Bắt đầu giao dịch
            transaction = new sql.Transaction(pool);
    
            await transaction.begin(); // Bắt đầu giao dịch
    
            const request = new sql.Request(transaction);
    
            const insertResult = await request
                .input('namemovie', sql.NVarChar, namemovie)
                .input('image', sql.VarChar, imageUrl)
                .input('time', sql.Int, time)
                .input('description', sql.Text, description)
                .input('releaseddate', sql.Date, releaseddate)
                .input('language', sql.NVarChar, language)
                .input('cast', sql.NVarChar, cast)
                .input('price', sql.Float, price) // Thay đổi kiểu dữ liệu từ NVarChar sang Float nếu price là số
                .input('status', sql.Int, status)
                .query('INSERT INTO MOVIE (namemovie, image, time, description, releaseddate, language, cast, pricemovie, status) OUTPUT INSERTED.IDMovie VALUES (@namemovie, @image, @time, @description, @releaseddate, @language, @cast, @price, @status)');
    
            const idMovie = insertResult.recordset[0].IDMovie; // Lấy IDMovie từ kết quả đầu ra
    
            if (idMovie) {
                await request
                    .input('idType', sql.Int, idType)
                    .input('idMovie', sql.Int, idMovie)
                    .query('INSERT INTO DETAILTYPE (IDType, IDMovie) VALUES (@idType, @idMovie)');
            }
    
            await transaction.commit();
    
            res.status(201).json({
                code: 201,
                message: 'success',
                data: insertResult.recordset[0]
            });
    
        } catch (err) {
            // Rollback giao dịch trong trường hợp có lỗi
            if (transaction) {
                await transaction.rollback();
            }
    
            res.status(500).json({
                code: 500,
                message: err.message
            });
        }
    };
    
    
    exports.updateRoom = async (req, res) => {
        const { nameroom } = req.body;
        const idroom = req.params.idRoom; // Đảm bảo rằng bạn đang truyền đúng tên tham số
    
        try {
            const pool = await req.poolPromise;
    
            // Nếu có sự thay đổi thì trả về, còn nếu không có sự thay đổi (dữ liệu vẫn như cũ) thì trả về 0
            const updateResult = await pool.request()
                .input('nameroom', sql.NVarChar, nameroom)
                .input('idroom', sql.Int, idroom)
                .query(`
                    UPDATE ROOMS SET nameroom = @nameroom 
                    WHERE IDRoom = @idroom AND nameroom != @nameroom;
                    SELECT @@ROWCOUNT AS affectedRows;
                `);
    
            const affectedRows = updateResult.recordset[0].affectedRows;
    
            if (affectedRows === 0) {
                res.status(200).json({
                    code: 200,
                    message: 'No changes made',
                    data: {
                        idroom: idroom,
                        nameroom: nameroom
                    }

                });
            } else {
                res.status(200).json({
                    code: 200,
                    message: 'Update successful',
                    data: {
                        idroom: idroom,
                        nameroom: nameroom
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

    
    

exports.updateStatusMovie = async (req, res) => {
    const { status } = req.body;
    const idMovie = req.params.idMovie; // Đảm bảo rằng bạn đang truyền đúng tên tham số

    try {
        const pool = await req.poolPromise;

        // Nếu có sự thay đổi thì trả về, còn nếu không có sự thay đổi (dữ liệu vẫn như cũ) thì trả về 0
        const updateResult = await pool.request()
            .input('status', sql.Int, status) // Thay đổi kiểu dữ liệu thành Int nếu status là số
            .input('idMovie', sql.Int, idMovie)
            .query(`
                UPDATE MOVIE SET status = @status 
                WHERE IDMovie = @idMovie;
            `);

        if (updateResult.rowsAffected[0] > 0) {
            // Nếu cập nhật thành công
            res.status(200).json({
                code: 200,
                message: 'Movie status updated successfully'
            });
        } else {
            // Nếu không có bản ghi nào bị ảnh hưởng
            res.status(404).json({
                code: 404,
                message: 'Movie not found or no changes made'
            });
        }

    } catch (err) {
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

    

    exports.getallRoomByTheater = async (req, res) => {
        const idtheater = req.params.idTheater;
    
        try {
            const pool = await req.poolPromise;
            const result = await pool.request()
                .input('idtheater', sql.Int, idtheater)
                .query('SELECT * FROM ROOMS WHERE IDTHEATER = @idtheater');
    
            res.status(200).json({
                code: 200,
                message: 'success',
                data: result.recordset
            });
        } catch (err) {
            res.status(500).json({
                code: 500,
                message: err.message
            });
        }
    };

    
    
    
    exports.createSchedule = async (req, res) => {
        const { IDMovie,IDRoom,ShowDate,IDManager} = req.body;
    
        // Kiểm tra các tham số đầu vào
        
    
        const pool = await req.poolPromise;
        const transaction = new sql.Transaction(pool);
    
        try {
            const date = moment(ShowDate, 'YYYY-MM-DDTHH:mm:ss');
            
            if (!date.isValid()) {
                return res.status(400).json({
                    code: 400,
                    message: 'Invalid StartTime format'
                });
            }
    
            // Định dạng lại ngày giờ
            const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
            await transaction.begin();
    
            const request = new sql.Request(transaction);
            const insertResult = await request
                .input('IDMovie', sql.Int, IDMovie)
                .input('IDRoom', sql.Int, IDRoom)
                .input('ShowDate', sql.VarChar, formattedDate)
                .input('IDManager', sql.Int, IDManager)
                .query('INSERT INTO SCHEDULESHOW (IDMovie, IDRoom, ShowDate, IDManager) OUTPUT INSERTED.* VALUES (@IDMovie, @IDRoom, @ShowDate, @IDManager)');
    
            await transaction.commit();
    
            res.status(201).json({
                code: 201,
                message: 'success',
                data: insertResult.recordset[0]
            });
    
        } catch (err) {
            await transaction.rollback();
    
            res.status(500).json({
                code: 500,
                message: err.message
            });
        }
    };
    

    exports.getSchedules = async (req, res) => {
        const idMovie = req.params.idMovie;
        const startTime = req.query.startTime;
        const numberOfShowtimes =req.query.numberOfShowtimes;
        
        try {
            const pool = await req.poolPromise;
            const result = await pool.request()
                .input('idMovie', sql.Int, idMovie)
                .query('SELECT Time FROM Movies WHERE IDMovie = @idMovie');
    
            if (result.recordset.length === 0) {
                return res.status(404).json({
                    code: 404,
                    message: 'Movie not found'
                });
            }
    
            const duration = result.recordset[0].Time; // Giả sử rằng `Time` là thời gian chiếu phim tính bằng phút
    
            const schedules = generateShowtimes(startTime, duration, numberOfShowtimes);
    
            res.status(200).json({
                code: 200,
                message: 'Schedules created successfully',
                data: schedules
            });
    
        } catch (err) {
            console.error('Error creating schedules:', err);
            res.status(500).json({
                code: 500,
                message: 'Error creating schedules'
            });
        }
    };
    
    function generateShowtimes(startTime, duration, numberOfShowtimes) {
        let showtimes = [];
        let currentTime = new Date(`1970-01-01T${startTime}Z`); // Khởi tạo giờ bắt đầu chiếu
    
        for (let i = 0; i < numberOfShowtimes; i++) {
            showtimes.push(currentTime.toISOString().substr(11, 8)); // Lưu lại giờ chiếu hiện tại
    
            // Cộng thêm thời gian chiếu phim và thời gian dọn dẹp (20 phút) để tính giờ chiếu tiếp theo
            currentTime.setMinutes(currentTime.getMinutes() + duration + 20);
        }
    
        return showtimes;
    }
    const moment = require('moment');
    
    
    exports.getRoomNotHaveMovieByIDTheater = async (req, res) => {
        const idTheater = req.params.idTheater;
        const startTime = req.query.StartTime;
        const duration = req.query.Duration;
    
        if (!idTheater || !startTime || !duration) {
            return res.status(400).json({
                code: 400,
                message: 'Missing required parameters'
            });
        }
    
        try {
            const date = moment(startTime, 'YYYY-MM-DDTHH:mm:ss');
            
            if (!date.isValid()) {
                return res.status(400).json({
                    code: 400,
                    message: 'Invalid StartTime format'
                });
            }
    
            // Định dạng lại ngày giờ
            const formattedDate = date.format('YYYY-MM-DD HH:mm:ss');
    
            const pool = await req.poolPromise;
            const result = await pool.request()
                .input('StartTime', sql.VarChar, formattedDate)
                .input('IDTheater', sql.Int, idTheater)
                .input('Duration', sql.Int, duration)
                .query('EXEC GetRoomNotSchedule @IDTheater = @IDTheater, @StartTime = @StartTime, @Duration = @Duration');
    
            if (result.recordset.length > 0 && result.recordset[0].ErrorMessage) {
                // Xử lý thông báo lỗi từ stored procedure
                return res.status(400).json({ 
                    code: 400,
                    message: result.recordset[0].ErrorMessage 
                });
            } else {
                // Trả về dữ liệu phòng
                return res.status(200).json({
                    code: 200,
                    message: 'Success',
                    StartTime: formattedDate,
                    Duration: duration,
                    data: result.recordset
                });
            }
        } catch (err) {
            console.error('Error getting room:', err);
            res.status(500).json({
                code: 500,
                message: 'Error getting room'
            });
        }
    };
    

exports.createScheduleIntemp = async (req, res) => {
    const { idmovie, idroom, showdate, listtimeshow } = req.body;

    // Kiểm tra các tham số đầu vào
    if (idmovie == null) {
        return res.status(400).json({
            code: 400,
            message: 'idmovie is null'
        });
    } else if (idroom == null) {
        return res.status(400).json({
            code: 400,
            message: 'idroom is null'
        });
    } else if (showdate == null) {
        return res.status(400).json({
            code: 400,
            message: 'showdate is null'
        });
    } else if (listtimeshow == null) {
        return res.status(400).json({
            code: 400,
            message: 'listtimeshow is null'
        });
    }

    const pool = await req.poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);
        const insertResult = await request
            .input('idmovie', sql.Int, idmovie)
            .input('idroom', sql.Int, idroom)
            .input('showdate', sql.Date, showdate)
            .input('listtimeshow', sql.VarChar, listtimeshow)
            .query('INSERT INTO TEMP (idmovie, idroom, showdate, listtimeshow) OUTPUT INSERTED.* VALUES (@idmovie, @idroom, @showdate, @listtimeshow)');

        await transaction.commit();

        res.status(201).json({
            code: 201,
            message: 'success',
            data: insertResult.recordset[0]
        });

    } catch (err) {
        await transaction.rollback();

        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};
exports.GetDataIntemp = async (req, res) => {
    try {
        const pool = await req.poolPromise;

        // Bắt đầu giao dịch
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Lấy dữ liệu từ bảng TEMP
            const selectResult = await pool.request()
                .query('SELECT * FROM TEMP');

            const schedulesToArchive = selectResult.recordset;

            // Lưu dữ liệu vào bảng DETAILMOVIE
            for (let schedule of schedulesToArchive) {
                await pool.request()
                    .input('idMovie', sql.Int, schedule.IDMovie)
                    .input('idRoom', sql.Int, schedule.IDRoom)
                    .input('showDate', sql.Date, schedule.ShowDate)
                    .input('listtimeshow', sql.VarChar, schedule.ListTimeShow)
                    .query('INSERT INTO DETAILMOVIE (IDMovie, IDRoom, ShowDate, ListTimeShow) VALUES (@idMovie, @idRoom, @showDate, @listtimeshow)');
            }

            // Commit giao dịch sau khi thực hiện thành công
            await transaction.commit();

            res.status(201).json({
                code: 201,
                message: 'Data archived successfully',
                data:schedulesToArchive
            });
        } catch (err) {
            // Rollback giao dịch nếu có lỗi
            await transaction.rollback();

            console.error('Error archiving schedules:', err);
            res.status(500).json({
                code: 500,
                message: 'Error archiving schedules'
            });
        }

    } catch (err) {
        console.error('Error starting transaction:', err);
        res.status(500).json({
            code: 500,
            message: 'Error starting transaction'
        });
    }
};



exports.DeleteTemp = async (req, res) => {
    

    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .query('DELETE FROM TEMP');

        res.status(201).json({
            code: 201,
            message: 'success'
            
        });
    } catch (err) {
        res.status(500).json({
            code: 500,
            message: err.message
        });
    }
};

exports.getMovieByNameMovie = async (req, res) => {
    const SearchTerm = req.query.SearchTerm;

    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('SearchTerm', sql.NVarChar, SearchTerm)
            .query('EXEC Search_NameMovie @SearchTerm');

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error('Error details:', err); // Ghi log lỗi chi tiết
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message // Trả về thông điệp lỗi chi tiết
        });
    }
};


exports.getTicketMovie = async (req, res) => {
    const idMovie = req.params.idMovie;

    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('idMovie', sql.Int, idMovie)
            .query('select COUNT(IDMovie) As NumberTicket from TICKETS t join SCHEDULESHOW sch on sch.IDSchedule = t.IDSchedule where sch.IDMovie = @idMovie');

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error('Error details:', err); // Ghi log lỗi chi tiết
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message // Trả về thông điệp lỗi chi tiết
        });
    }
};
exports.getMovieScheduleByTheaterandDate = async (req, res) => {
    const ShowDate = req.query.ShowDate;
    const idTheater = req.params.idTheater;

    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('ShowDate', sql.Date, ShowDate)
            .input('IDTheater', sql.Int, idTheater)
            .query('EXEC GetMovieScheduleByTheaterAndDate @IDTheater,@ShowDate');

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error('Error details:', err); // Ghi log lỗi chi tiết
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message // Trả về thông điệp lỗi chi tiết
        });
    }
};


exports.getShowtimeOfMovie = async (req, res) => {
    const ShowDate = req.query.ShowDate;
    const IDMovie = req.query.IDMovie;
    const idTheater = req.params.idTheater;

    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('ShowDate', sql.Date, ShowDate)
            .input('IDMovie', sql.Int, IDMovie)
            .input('IDTheater', sql.Int, idTheater)
            .query('EXEC GetShowTimes @IDMovie,@IDTheater,@ShowDate;');

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error('Error details:', err); // Ghi log lỗi chi tiết
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message // Trả về thông điệp lỗi chi tiết
        });
    }
};

exports.getTypeMovie = async (req, res) => {
    const IDMovie = req.params.id;
    try {
        const pool = await req.poolPromise;
        const result = await pool.request()
            .input('IDMovie', sql.Int, IDMovie)
            .query('select t.IDType,t.NameType from TYPEMOVIES  t join DETAILTYPE dt on dt.IDType = t.IDType where dt.IDMovie = @IDMovie;');

        res.status(200).json({
            code: 200,
            message: 'success',
            data: result.recordset
        });
    } catch (err) {
        console.error('Error details:', err); // Ghi log lỗi chi tiết
        res.status(500).json({
            code: 500,
            message: 'Error retrieving movie',
            error: err.message // Trả về thông điệp lỗi chi tiết
        });
    }
};




