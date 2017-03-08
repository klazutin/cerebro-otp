# Cerebro OTP plugin

![](http://lazut.in/img/github-cerebro-otp.png)
This plugin generates one-time authorization codes for use with any services that support Google Authenticator for two-step verification.  
The codes are generated in the plugin and are never sent over the internet.  
Code for generating the codes borrowed from [otplib](//github.com/yeojz/otplib) with minor modifications.  
Tested to work on MacOS, Arch Linux, Windows 10.

## Installation
After installing the plugin, create the `.cerebro-otp` (note the leading dot) file in your home directory:
- for Windows: `C:\Users\<user>\.cerebro-otp`
- for MacOS: `\Users\<user>\.cerebro-otp`
- for Linux: `\home\<user>\.cerebro-otp`

In the file, enter the site identifier and the OTP secret separated by a space. You can get the OTP secret while setting up the 2-factor authentication, it is usually presented along with the QR code. Be sure to remove all spaces from the secret when pasting it. Example:
```
google 5D41402ABC4B2A76B9719D911017C592
dropbox 7D793037A0760186
github 6dd075556effaa6e
```
