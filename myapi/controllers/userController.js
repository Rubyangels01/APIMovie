const bcrypt = require('bcrypt');

const { sql, poolPromise } = require('../config/database');
const { query } = require('express');
const jwt = require('jsonwebtoken');


const secretKey = 'ruby0310';



exports.login = async (req, res) => {
    const { Email, PassWord } = req.body;
    try {
        const pool = await poolPromise;
        if (!Email || !PassWord) {
            return res.status(400).json({
                code: 400,
                message: 'Email or password is empty'
            });
        }
        const result = await pool.request()
            .input('Email', sql.VarChar, Email)
            .query('SELECT * FROM CUSTOMERS WHERE Email = @Email');

        
        if (result.recordset.length === 0) {
            return res.status(400).json({ 
                code:400,
                message: 'Invalid email or password' });
        }

        const user = result.recordset[0];
        const isPasswordMatch = await bcrypt.compare(PassWord, user.PassWord); // So sánh mật khẩu

        if (!isPasswordMatch) {
            return res.status(400).json({ 
                code:400,
                message: 'Invalid email or password' });
        }
        // Tạo JWT nếu mật khẩu khớp và vai trò là hợp lệ
        //const token = jwt.sign({ id: user.ID, email: user.Email, role: user.Role }, secretKey, { expiresIn: '1h' });

        res.status(201).json({
           
            code: 201,
            message: 'success',
            data: {
                "IDCustomer":user.IDCustomer,
                "UserName":user.UserName,
                "Email":user.Email,
                "PassWord":user.PassWord,
                "Phone":user.Phone,
                "Age":user.Age,
                "Gender":user.Gender
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserByID = async (req, res) => {
    const userId = req.params.id; // Lấy id người dùng từ request parameter

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idUser', sql.Int, userId)
            .query('SELECT * FROM CUSTOMERS WHERE IdCustomer = @idUser');

        if (result.recordset.length === 0) {
            return res.status(404).json(
                { code:404,
                    message: 'User not found' });
        }

        const user = result.recordset[0]; // Lấy thông tin người dùng từ recordset

        // Trả về thông tin người dùng
        res.status(200).json({
            code: 200,
            message:'success',
            data: user
            // Thêm các thông tin khác cần thiết
        });
    } catch (err) {
        
        res.status(500).json({ code:500,
            message: 'Error retrieving user' });
    }
};

exports.createUser = async (req, res) => {
    const {email, password, age, username, phone, gender } = req.body;

    try {
        const pool = await poolPromise;

        // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu
        const emailCheckResult = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT COUNT(*) AS emailCount FROM CUSTOMERS WHERE email = @email');

        // Nếu email đã tồn tại, trả về lỗi
        if (emailCheckResult.recordset[0].emailCount > 0) {
            return res.status(400).json({
                code:400,
                message: 'Email already exists' });
        }

        // Hash mật khẩu và lấy substring có độ dài tối đa là 20 ký tự
        const hashedPassword = await bcrypt.hash(password, 10);

        // Thêm người dùng vào cơ sở dữ liệu và lấy thông tin chi tiết từ insertResult
        const insertResult = await pool.request()
            .input('age', sql.Date, age)
            .input('username', sql.NVarChar, username)
            .input('phone', sql.VarChar, phone)
            .input('gender',sql.NVarChar, gender)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .query('EXEC ADD_ACCOUNT_USER @Email = @email, @Password = @password,@Age = @age, @FullName = @username,@Phone = @phone,@Gender = @gender;');
    
        // Trả về thông tin chi tiết từ insertResult
        res.status(201).json({ 
            code: 201,
            message: 'success', 
            insertedUser: insertResult.recordset[0] // Thông tin chi tiết của người dùng vừa được thêm vào
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};




exports.getAllUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Users');
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

exports.updateAccount = async (req, res) => {
    const { Username, Phone, Age, Gender } = req.body;
    const idUser = req.params.idUser; // Đảm bảo rằng bạn đang truyền đúng tên tham số

    try {
        const pool = await poolPromise;

        // Nếu có sự thay đổi thì trả về, còn nếu không có sự thay đổi (dữ liệu vẫn như cũ) thì trả về 0
        const updateResult = await pool.request()
            .input('Username', sql.NVarChar, Username)
            .input('Phone', sql.VarChar, Phone)
            .input('Age', sql.Date, Age)
            .input('Gender', sql.NVarChar, Gender)
            .input('IDCustomer', sql.Int, idUser)
            .query(`
                EXEC UPDATE_CUSTOMERINFOR @Username = @Username, @Phone = @Phone, @Age = @Age, @Gender = @Gender, @idCustomer = @IDCustomer
            `);

        const affectedRows = updateResult.recordset[0].affectedRows;

        if (affectedRows === 0) {
            res.status(201).json({
                code: 201,
                message: 'No changes made',
                data: {
                    "IDCustomer": idUser,
                    "Username": Username,
                    "Phone": Phone,
                    "Age": Age,
                    "Gender": Gender
                }
            });
        } else {
            res.status(201).json({
                code: 201,
                message: 'Update successful',
                data: {
                    "IDCustomer": idUser,
                    "Username": Username,
                    "Phone": Phone,
                    "Age": Age,
                    "Gender": Gender
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


exports.updatePassWord = async (req, res) => {
    const { CurrentPassword, PassWord, PasswordConfirm } = req.body;
    const idUser = req.params.idUser;

    try {
        const pool = await poolPromise;

        // Lấy mật khẩu hiện tại từ cơ sở dữ liệu
        const result = await pool.request()
            .input('IDCustomer', sql.VarChar, idUser)
            .query('SELECT PassWord FROM CUSTOMERS WHERE IDCustomer = @IDCustomer');

        const storedPassword = result.recordset[0].PassWord;

        // So sánh mật khẩu hiện tại với mật khẩu đã lưu
        const isPasswordMatch = await bcrypt.compare(CurrentPassword, storedPassword);

        if (!isPasswordMatch) {
            return res.status(200).json({ 
                code: 400,
                message: 'Current password is incorrect' 
            });
        }

        // Kiểm tra mật khẩu mới và xác nhận mật khẩu
        if (PassWord !== PasswordConfirm) {
            return res.status(200).json({ 
                code: 400,
                message: 'Password and confirm password do not match' 
            });
        }

        // Kiểm tra xem mật khẩu mới có giống mật khẩu hiện tại không
        if (CurrentPassword === PassWord) {
            return res.status(200).json({ 
                code: 400,
                message: 'New password must be different from current password' 
            });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(PassWord, 10);

        // Cập nhật mật khẩu mới vào cơ sở dữ liệu
        const updateResult = await pool.request()
            .input('PassWord', sql.VarChar, hashedPassword)
            .input('IDCustomer', sql.Int, idUser)
            .query('UPDATE CUSTOMERS SET PassWord = @PassWord WHERE IDCustomer = @IDCustomer');

        const affectedRows = updateResult.rowsAffected[0];

        if (affectedRows === 0) {
            return res.status(201).json({
                code: 201,
                message: 'No changes made'
            });
        } else {
            return res.status(201).json({
                code: 201,
                message: 'Password updated successfully'
            });
        }

    } catch (err) {
        console.error('Error updating password:', err.message);
        return res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
};
