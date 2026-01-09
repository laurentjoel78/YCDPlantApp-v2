const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { Op } = require('sequelize');

console.log('✅ Password reset page route loaded');

// Serve password reset page
router.get('/reset-password', async (req, res) => {
  console.log('🔐 Password reset page requested with token:', req.query.token?.substring(0, 10) + '...');
  const { token } = req.query;
  
  if (!token) {
    return res.send(getErrorPage('Invalid or missing reset token.'));
  }

  // Check if token is valid (stored in User model)
  const user = await User.findOne({
    where: {
      password_reset_token: token,
      password_reset_expires: { [Op.gt]: new Date() }
    }
  });

  if (!user) {
    return res.send(getErrorPage('This reset link has expired or is invalid. Please request a new password reset from the app.'));
  }

  res.send(getResetPage(token));
});

// Handle password reset form submission
router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password) {
    return res.send(getErrorPage('Missing required fields.'));
  }

  if (password !== confirmPassword) {
    return res.send(getErrorPage('Passwords do not match. Please go back and try again.'));
  }

  if (password.length < 6) {
    return res.send(getErrorPage('Password must be at least 6 characters long.'));
  }

  try {
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.send(getErrorPage('This reset link has expired or is invalid. Please request a new password reset.'));
    }

    // Save plain password - the User model's beforeSave hook will hash it
    await user.update({ 
      password_hash: password,
      password_reset_token: null,
      password_reset_expires: null
    });

    res.send(getSuccessPage());
  } catch (error) {
    console.error('Password reset error:', error);
    res.send(getErrorPage('An error occurred. Please try again.'));
  }
});

function getResetPage(token) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - YCD Farmer Guide</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 16px; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 400px;
          width: 100%;
        }
        .logo { text-align: center; margin-bottom: 30px; font-size: 48px; }
        h1 { color: #2E7D32; text-align: center; margin-bottom: 10px; font-size: 24px; }
        .subtitle { color: #666; text-align: center; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
        input { 
          width: 100%; 
          padding: 14px; 
          border: 2px solid #e0e0e0; 
          border-radius: 8px; 
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input:focus { outline: none; border-color: #4CAF50; }
        button { 
          width: 100%; 
          padding: 16px; 
          background: #4CAF50; 
          color: white; 
          border: none; 
          border-radius: 8px; 
          font-size: 18px; 
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover { background: #388E3C; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🌱</div>
        <h1>Reset Your Password</h1>
        <p class="subtitle">Enter your new password below</p>
        <form method="POST" action="/reset-password">
          <input type="hidden" name="token" value="${token}">
          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" id="password" name="password" required minlength="6" placeholder="Enter new password">
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" placeholder="Confirm new password">
          </div>
          <button type="submit">🔐 Reset Password</button>
        </form>
        <p class="footer">© ${new Date().getFullYear()} YCD Farmer Guide</p>
      </div>
    </body>
    </html>
  `;
}

function getSuccessPage() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful - YCD Farmer Guide</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 16px; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #2E7D32; margin-bottom: 15px; }
        p { color: #666; margin-bottom: 20px; line-height: 1.6; }
        .steps { text-align: left; margin: 18px 0 22px; background: #f7faf7; border: 1px solid #e6f2e6; padding: 14px; border-radius: 12px; }
        .steps li { margin-left: 18px; color: #2b2b2b; margin-bottom: 8px; }
        .btn { display: inline-block; width: 100%; padding: 14px 16px; border-radius: 10px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; }
        .btn-primary { background: #2E7D32; color: #fff; }
        .btn-primary:hover { background: #256a29; }
        .btn-secondary { background: transparent; color: #2E7D32; border: 2px solid #2E7D32; margin-top: 10px; }
        .btn-secondary:hover { background: rgba(46,125,50,0.08); }
        .hint { display: none; margin-top: 14px; color: #666; font-size: 13px; }
        .footer { margin-top: 30px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>Password Updated</h1>
        <p>Your password has been changed successfully.</p>
        <div class="steps">
          <ol>
            <li>Return to the <strong>YCD Farmer Guide</strong> app.</li>
            <li>Log in using your <strong>new</strong> password.</li>
            <li>If you refresh this page later, the link may show “expired” (that’s normal for security).</li>
          </ol>
        </div>
        <button class="btn btn-primary" type="button" onclick="tryOpenApp()">Open the app</button>
        <button class="btn btn-secondary" type="button" onclick="closeThisPage()">Close this page</button>
        <div id="fallbackHint" class="hint">
          If the app didn’t open automatically, just close this page and open the app manually.
        </div>
        <p class="footer">© ${new Date().getFullYear()} YCD Farmer Guide</p>
      </div>

      <script>
        function tryOpenApp() {
          // This only works if the mobile app is configured for deep linking.
          // If not, we show a friendly fallback message.
          var url = 'ycd-farmer-guide://login';
          try { window.location.href = url; } catch (e) {}
          setTimeout(function () {
            var el = document.getElementById('fallbackHint');
            if (el) el.style.display = 'block';
          }, 1200);
        }
        function closeThisPage() {
          try { window.close(); } catch (e) {}
          var el = document.getElementById('fallbackHint');
          if (el) el.style.display = 'block';
        }
      </script>
    </body>
    </html>
  `;
}

function getErrorPage(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - YCD Farmer Guide</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 16px; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #c62828; margin-bottom: 15px; }
        p { color: #666; margin-bottom: 20px; line-height: 1.6; }
        .note { margin-top: 6px; font-size: 13px; color: #777; }
        .footer { margin-top: 30px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Oops!</h1>
        <p>${message}</p>
        <p class="note">If you already reset your password successfully, you can close this page and log in in the app.</p>
        <p class="footer">© ${new Date().getFullYear()} YCD Farmer Guide</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
