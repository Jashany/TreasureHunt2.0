// routes/auth.routes.js
import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile
} from '../Controllers/auth.controller.js'
import { verify } from '../middlewares/authentication.js';

const userRouter = express.Router();

// Public routes
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);

// Private routes (require token verification)
userRouter.post('/logout', verify, logoutUser); // Logout requires knowing *who* is logging out
userRouter.get('/profile', verify, getUserProfile); // Getting profile requires authentication

// Example of using role authorization (if you had an admin-only auth route)
// import { roleAuthorization } from '../middleware/auth.middleware.js';
// router.get('/admin-only-route', verify, roleAuthorization(['admin']), someAdminController);

export default userRouter;