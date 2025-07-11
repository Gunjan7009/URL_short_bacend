const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
    algorithm: 'HS384',
    noTimestamp: true,
  });
};

module.exports = generateToken;
