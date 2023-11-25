const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
// const BasicStrategy = require('passport-http').BasicStrategy;

const jwtSettings = require('../constants/jwtSetting');
const { Customer } = require('../models');

const passportVerifyTokenUser = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken('Authorization'),
    secretOrKey: jwtSettings.SECRET,
  },
  async (payload, done) => {
    try {
      const user = await Customer.findOne({
        _id: payload._id,
        isDeleted: false,
      }).select('-password').populate('address');

      if (!user) return done(null, false);

      return done(null, user);
    } catch (error) {
      done(error, false);
    }
  },
);

const passportVerifyAccountUser = new LocalStrategy(
  {
    usernameField: 'email',
  },
  async (email, password, done) => {
    try {
      const user = await Customer.findOne({
        isDeleted: false,
        email,
      });

      if (!user) return done(null, false);

      const isCorrectPass = await user.isValidPass(password);

      if (!isCorrectPass) return done(null, false);

      user.password = undefined;

      return done(null, user);
    } catch (error) {
      done(error, false);
    }
  },
);

// const passportConfigBasic = new BasicStrategy(async function (username, password, done) {
//   try {
//     const user = await Employee.findOne({ email: username });

//     if (!user) return done(null, false);

//     const isCorrectPass = await user.isValidPass(password);

//     if (!isCorrectPass) return done(null, false);

//     return done(null, user);
//   } catch (error) {
//     done(error, false);
//   }
// });

module.exports = {
  passportVerifyTokenUser,
  passportVerifyAccountUser,
  // passportConfigBasic,
};
