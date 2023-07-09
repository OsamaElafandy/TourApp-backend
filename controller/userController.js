const User = require(__dirname + '/../models/userModel');
const catchAsync = require(__dirname + '/../utils/catchAsync');
const AppError = require(__dirname + '/../utils/appError');

const filterObj = (obj,...allowedFields)=>{
    const newObj = {};
    Object.keys(obj).forEach(el=>{
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    })
    return newObj;
}

exports.updateUser=  catchAsync(async (req, res, next) => {
   
    if(req.body.password ||req.body.passwordConfirm){
        return next(new AppError(
            'This Is Not Password Route Use /passwordConfirm',400
        ))
    }
    
    const userUpdated = await User.findByIdAndUpdate(req.user.id
        ,filterObj(
            req.body,'name','email'
        ),{
            new:true,
            runValidators:true
        });
   
    res.status(200).json({
        status: 'success',
        data: {
            user: userUpdated
        }
    });
});

exports.getAllUsers = (req, res) => {
   
};
exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};
exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined!'
    });
};

exports.deleteUser =  catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id,{active:false});
    res.status(204).json({
        status: 'success',
    })
});