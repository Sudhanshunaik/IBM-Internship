'use strict';

const { StatusCodes } = require('http-status-codes');
const { register, login } = require('../services/auth.service');

async function postRegister(req, res) {
  const result = await register(req.body);
  res.status(StatusCodes.CREATED).json(result);
}

async function postLogin(req, res) {
  const result = await login(req.body);
  res.status(StatusCodes.OK).json(result);
}

module.exports = { postRegister, postLogin };
