// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";

const verify = async (req, res, next) => {
    let token;
    // Ensure cookies are parsed (you'll need cookie-parser middleware in your main app)
    token = req.cookies?.jwt; // Use optional chaining

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // decoded should contain { _id: ..., role: ... } based on generateToken

            // Find the user but DON'T select the password unless needed elsewhere
            const currentUser = await UserModel.findById(decoded._id).select('-password');

            if (!currentUser) {
                // User associated with token no longer exists
                 // Clear the invalid cookie
                 res.cookie('jwt', '', { httpOnly: true, expires: new Date(0), secure: true, sameSite: 'None' });
                return res.status(401).json({
                    success: false,
                    logout: true, // Indicate frontend should force logout
                    message: "Not authorized: User not found."
                });
            }

            // Attach user info (without password) to the request object
            req.user = currentUser; // Attach the full user object (minus password)
                                    // Or just req.user = decoded; if you only need _id and role downstream

            next(); // Proceed to the next middleware or route handler

        } catch (error) {
            console.error("Token verification failed:", error.message);
             // Clear the invalid cookie
             res.cookie('jwt', '', { httpOnly: true, expires: new Date(0), secure: true, sameSite: 'None' });
            res.status(401).json({
                success: false,
                logout: true, // Indicate frontend should force logout
                message: "Not authorized: Token failed or expired."
            });
        }
    } else {
        res.status(401).json({
            success: false,
            logout: true, // Indicate frontend should force logout
            message: "Not authorized: No token provided."
        });
    }
};

const roleAuthorization = (roles) => { // roles should be an array, e.g., ['admin'] or ['admin', 'user']
    return (req, res, next) => {
        // Assumes 'verify' middleware runs first and attaches req.user
        if (!req.user || !req.user.role) {
             return res.status(401).json({ // Should ideally be caught by 'verify'
                success: false,
                message: "Not authorized: Authentication required."
            });
        }

        if (roles.includes(req.user.role)) {
            next(); // User has one of the required roles
        } else {
            res.status(403).json({ // 403 Forbidden - authenticated but not authorized
                success: false,
                message: "Forbidden: You do not have permission to access this resource."
            });
        }
    };
};

export { verify, roleAuthorization };