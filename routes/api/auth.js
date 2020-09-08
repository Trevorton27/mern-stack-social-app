const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const {
    body,
    validationResult
} = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');

//@route  GET api/auth
//@desc   Test route
//@access Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        console.log('error message ', err.message);
        res.status(500).send('Server error.');
    }
});

//@route  POST api/auth
//@desc   Authenticate user & get token
//@access Public

router.post(
    '/',
    [
        body('email', 'Please include a valid email').isEmail(),
        body(
            'password',
            'Password is required'
        ).exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }
        console.log(req.body);

        const {
            email,
            password
        } = req.body;

        try {
            //see if user exists

            let user = await User.findOne({
                email,
            });

            if (!user) {
                return res.status(400).json({
                    errors: [{
                        msg: 'Invalid credentials',
                    }, ],
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    errors: [{
                        msg: 'Invalid credentials',
                    }, ],
                });
            }

            //Return json webtoken

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(payload, config.get('jwtSecret'), {
                expiresIn: 360000
            }, (err, token) => {
                if (err) throw err;
                res.json({
                    token
                });
                console.log('webToken is ', token);
            });
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;