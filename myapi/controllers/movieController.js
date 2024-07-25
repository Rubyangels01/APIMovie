
const { sql, poolPromise } = require('../config/database');
const { query } = require('express');

const jwt = require('jsonwebtoken');



exports.getAllMovies = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM MOVIE');
        res.status(200).json(
            {
                'code':200,
                'message':'success',
                'data': result.recordset
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
            const pool = await poolPromise;
            const result = await pool.request()
            .input('idMovie',sql.Int,idMovie)
            .query('SELECT * FROM MOVIES WHERE IDMOVIE = @idMovie');
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
            const pool = await poolPromise;
            const imageUrl = `http://192.168.1.12:3002/${image.replace(/\\/g, '/')}`;
           
    
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
                const pool = await poolPromise;
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
    

    exports.createRoom = async (req, res) => {
        const { nameroom } = req.body;
        const idTheater = req.params.idtheater;
    
        try {
            const pool = await poolPromise;
    
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
    
    exports.createMovie = async (req, res) => {

        const { namemovie, time, description,releaseddate,language,cast } = req.body;
        const image = req.file ? req.file.path : null;

        if (!image) {
            return res.status(400).json({
                code: 400,
                message: 'Image is required'
            });
        }

        try {
            const pool = await poolPromise;
            const imageUrl = `http://192.168.1.12:3002/${image.replace(/\\/g, '/')}`;


            const insertResult = await pool.request()
                .input('namemovie', sql.NVarChar, namemovie)
                .input('image', sql.VarChar, imageUrl)
                .input('time', sql.Int, time)
                .input('description',sql.Text,description)
                .input('releaseddate', sql.Date,releaseddate)
                .input('language', sql.NVarChar,language)
                .input('cast',sql.NVarChar,cast)
                
                .query('INSERT INTO MOVIE (namemovie,image, time,description,releaseddate,language,cast) OUTPUT INSERTED.* VALUES (@namemovie,@image, @time,@description,@releaseddate,@language,@cast)');
    
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
    
    exports.updateRoom = async (req, res) => {
        const { nameroom } = req.body;
        const idroom = req.params.idRoom; // Đảm bảo rằng bạn đang truyền đúng tên tham số
    
        try {
            const pool = await poolPromise;
    
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
    

    exports.getallRoomByTheater = async (req, res) => {
        const idtheater = req.params.idTheater;
    
        try {
            const pool = await poolPromise;
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
    
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
    
        try {
            await transaction.begin();
    
            const request = new sql.Request(transaction);
            const insertResult = await request
                .input('idmovie', sql.Int, idmovie)
                .input('idroom', sql.Int, idroom)
                .input('showdate', sql.Date, showdate)
                .input('listtimeshow', sql.VarChar, listtimeshow)
                .query('INSERT INTO DETAILMOVIE (idmovie, idroom, showdate, listtimeshow) OUTPUT INSERTED.* VALUES (@idmovie, @idroom, @showdate, @listtimeshow)');
    
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
            const pool = await poolPromise;
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
exports.getRoomNotHaveMovieByIDTheater = async (req, res) => {
    const idtheater = req.params.idTheater;
    const idmovie = req.query.idMovie;
    const showdate = req.query.showDate;

    if(idmovie == null)
        {
            res.status(400).json({
                code: 400,
                message: 'Not Found Movie',
                
            }); 
        }
        if(idtheater == null)
            {
                res.status(400).json({
                    code: 400,
                    message: 'Not Found Theater',
                    
                }); 
            }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idmovie', sql.Int, idmovie)
            .input('idtheater', sql.Int, idtheater)
            .input('showdate', sql.Date, showdate)
            .query('EXEC GETROOMNOTHAVESCHEDULEBYMOVIE @idtheater = @idtheater,@idMovie = @idmovie, @showDate = @showdate');
        
            
            if (result.recordset.length > 0 && result.recordset[0].ErrorMessage) {
                // Xử lý thông báo lỗi
                return res.status(400).json({ 
                    code: 400,
                    message: result.recordset[0].ErrorMessage });
            } else {
                // Trả về dữ liệu phòng
                return res.status(200).json({
                    code: 200,
                    message: 'success',
                    data: result.recordset
                });
            }          
        

    } catch (err) {
        console.error('Error get room:', err);
        res.status(500).json({
            code: 500,
            message: 'Error get room'
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

    const pool = await poolPromise;
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
        const pool = await poolPromise;

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
        const pool = await poolPromise;
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
        const pool = await poolPromise;
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