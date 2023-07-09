
const jwt = require('jsonwebtoken');
const User = require(__dirname + '/../models/userModel');
const catchAsync = require(__dirname + '/../utils/catchAsync');
const AppError = require(__dirname + '/../utils/appError');
const { promisify } = require('util');
const sendEmail = require(__dirname + '/../utils/email');
const crypto = require('crypto');


const signToken = id => {
    return jwt.sign({ id: id }, "process.env.JWT_SECRET");
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000,
        ),
        httpOnly: true,
    });

    // Remove password from output
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token: token,
        data: {
            user: user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    console.log("START");
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });

    createSendToken(newUser, 201, res);
    console.log("END");
});


exports.login = catchAsync(async (req, res, next) => {
    console.log("Start Login");
    const { email, password } = req.body;

    // 1) Check if email and password exist

    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email: email }).select('+password');
    const correctPassword = await user.correctPassword(password, user.password);

    if (!user || !correctPassword) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
    console.log("End Login");

});


exports.protect = catchAsync(async (req, res, next) => {
    console.log("Start Protect");
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        console.log("Start Token");
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    // token , secret
    const decoded = await promisify(jwt.verify)(token, "process.env.JWT_SECRET");
    console.log(decoded);
    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }


    // 4) Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        console.log("changedPasswordAfter");
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    console.log("SS");
    req.user = freshUser;
    console.log("EE");
    console.log("End Protect");
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        console.log("Start restrictTo");
        // roles ['admin','lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        console.log("End restrictTo");
        next();
    };
}

exports.forgetPassword = catchAsync(async (req, res, next) => {

    console.log("Start forgetPassword");
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }
    // 2) Generate a new token for the user
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message: message
        });
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
    console.log("End forgetPassword");
});



exports.resetPassword = catchAsync(async (req, res, next) => {
    console.log("Start resetPassword");
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    console.log("hashedToken");
    console.log(hashedToken);
    const user = await User.findOne({ passwordResetToken: hashedToken });
    console.log("user");
    console.log(user);
    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    if (Date.now() > user.passwordResetExpires) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    console.log("Start updatePassword");
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong.', 401));
    }
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});
