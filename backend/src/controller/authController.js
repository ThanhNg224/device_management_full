const User = require("../model/auth.model");
const jwt = require('jsonwebtoken');

const AuthController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          message: "Thiếu username hoặc password",
        });
      }
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({
          message: "Sai username hoặc password",
        });
      }
      if (user.password !== password) {
        return res.status(401).json({
          message: "Sai username hoặc password",
        });
      }
      const accessToken = jwt.sign(
        {
          id: user._id,
          username: user.username,
          role: user.role || "user",
        },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      console.log("JWT_SECRET:", process.env.JWT_SECRET);
      return res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName || user.username,
          role: user.role || "user",
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Có lỗi phía server",
      });
    }
  },

  logout: async (req, res) => {
    try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
        success: false,
        message: "refreshToken is required",
        });
    }
    return res.json({ success: true });
    } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Server error" });
    }
  },

  refresh: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          code: "VALIDATION_FAILED",
          message: "Thiếu refreshToken",
        });
      }
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) {
          return res.status(401).json({
            code: "REFRESH_TOKEN_INVALID",
            message: "refreshToken không hợp lệ hoặc đã hết hạn",
          });
        }

        const accessToken = jwt.sign(
          { idUser: user.idUser },
          process.env.JWT_SECRET,
          { expiresIn: "30m" }
        );
        const newRefreshToken = jwt.sign(
          { idUser: user.idUser },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: "7d" }
        );

        return res.json({
          accessToken,
          refreshToken: newRefreshToken,
        });
      });
    } catch (err) {
      console.error("Refresh error:", err);
      res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "Server error",
      });
    }
  },

};

module.exports = AuthController;