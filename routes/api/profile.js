const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const User = require('../../models/User');
const { body, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');

//@route  GET api/profile/me
//@desc   GET current user profile
//@access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);
    console.log('user object is : ', req.user.id);
    if (!profile) {
      return res.status(400).json({
        msg: 'There is no profile for this user.'
      });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error. Please check console.');
  }
});

//@route  POST api/profile
//@desc   create or update user profile
//@access Private

router.post(
  '/',
  [
    auth,
    [
      body('status', 'Status is required').not().isEmpty(),
      body('skills', 'Skills field cannot be empty').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook
    } = req.body;

    //build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    profileFields.skills = Array.isArray(skills)
      ? skills
      : skills.split(',').map((skill) => ' ' + skill.trim());
    // ? skills
    // : ;

    console.log('profileFields: ', profileFields);

    //build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({
        user: req.user.id
      });
      if (profile) {
        //update
        profile = await Profile.findOneAndUpdate(
          {
            user: req.user.id
          },
          {
            $set: profileFields
          },
          {
            new: true
          }
        );

        return res.json(profile);
      }

      //create profile
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server error');
    }
  }
);

//@route  GET api/profile
//@desc   get all profiles
//@access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

//@route  GET api/profile/user/:user_id
//@desc   get profile by user ID
//@access Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);
    if (!profile)
      return res.status(400).json({
        msg: 'Profile not found'
      });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        msg: 'Profile not found'
      });
    }
    res.status(500).send('Server error.');
  }
});

//@route  DELETE api/profile
//@desc   DELETE profile, user & posts
//@access Private
router.delete('/', auth, async (req, res) => {
  try {
    //Remove users posts
    await Post.deleteMany({ user: req.user.id });
    //Remove profile
    await Profile.findOneAndRemove({
      user: req.user.id
    });
    //Remove user
    await User.findOneAndRemove({
      _id: req.user.id
    });
    res.json({
      msg: 'User deleted.'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error.');
  }
});

//@route  PUT api/profile/experience
//@desc  PUT add profile experience
//@access Private

router.put(
  '/experience',
  [
    auth,
    [
      body('title', 'Title is required').not().isEmpty(),
      body('company', 'Company is required').not().isEmpty(),
      body('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    console.log('req: ', req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/experience/:exp_id
//@desc  DELETE experience from profile
//@access Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.experience = foundProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );
    console.log('request experience id: ', req.params);

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  PUT api/profile/education
//@desc  PUT add profile education
//@access Private

router.put(
  '/education',
  [
    auth,
    [
      body('school', 'School is required').not().isEmpty(),
      body('degree', 'Degree is required').not().isEmpty(),
      body('fieldofstudy', 'Field of study is required').not().isEmpty(),
      body('from', 'From date is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/education/:edu_id
//@desc  DELETE education from profile
//@access Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.education = foundProfile.education.filter(
      (exp) => exp._id.toString() !== req.params.edu_id
    );
    console.log('request education id: ', req.params);

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route  GET api/profile/github/:username
//@desc  GET user repos from github
//@access Public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecretShhhh')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No github profile found :-( ' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
