const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const {
    body,
    validationResult
} = require('express-validator');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
//@route  POST api/users
//@desc   register user
//@access Public

router.post('/', [
    body('name', 'A name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({
        min: 6
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    console.log(req.body);

    const {
        name,
        email,
        password
    } = req.body;

    try {
        //see if user exists

        let user = await User.findOne({
            email
        });

        if (user) {
            res.status(400).json({
                errors: [{
                    msg: 'User already exists'
                }]
            });
        }

        //get user's gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });
        //Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        //Return json webtoken
        res.send('User registered');

    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }


})

module.exports = router;