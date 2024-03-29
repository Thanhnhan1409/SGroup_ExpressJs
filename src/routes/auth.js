/* eslint-disable no-undef */
const express = require('express');
const jwt = require('jsonwebtoken');
const auth_router = express.Router();
const hashPassword = require('../middleware/hashPassword');
const {
    getUserByData,
    addUser,
    getRoles,
} = require('../database/userQuery');
require('dotenv').config();


const {  validateLogin } = require('../middleware/validate');

auth_router.post('/register', async (req, res) => {
    const {
        username,
        password,
        confirmPassword,
        email,
        gender,
        fullname,
        age,
    } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({
            message: 'The password confirmation does not match!',
        });
    }

    try {
        const user = await getUserByData('username', username);
        if (user) {
            return res.status(400).json({
                message: 'Username already exists',
            });
        }
        const created_by = null;
        await addUser({
            fullname,
            gender,
            age,
            created_by,
            email,
            username,
            password,
        });
        return res.status(201).send('Register successfully');
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error retrieving user',
        });
    }
});

auth_router.post('/login', validateLogin, async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await getUserByData('username', username);
        const userRoles = await getRoles('users.id',user.id);
        console.log('user', user);
        if (!user) {
            return res.status(404).json({
                message: 'Username is not exists',
            });
        } else {
            const hashedPassword = hashPassword(password, user.salt);
            if (hashedPassword.pass === user.password) {
                const token = jwt.sign({
                    username:username,
                    user_id: user.id,
                },
                process.env.SECRET,
                {
                    algorithm: 'HS256',
                    expiresIn: '1d',
                    issuer: 'ThanhNhan',
                }
                );
                return res.status(200).json({
                    access_token: token,
                    user_role: userRoles,
                    message:'Login susscess'
                })
            } else {
                return res.status(400).json({
                    message: 'Invalid username or password',
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Error retrieving user',
        });
    }
});

module.exports = auth_router;