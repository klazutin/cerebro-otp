'use strict';
const React = require('react');
const icon = require('./plugin-icon.png');
const crypto = require('crypto');
const base32 = require('thirty-two');

var sites = {};
var D, A;

readFile();

/**
 * Google Authenticator class.
 * Code taken from github.com/yeojz/otplib
 * with minor modifications and added seconds to expiry.
*/
class Authenticator {
    static stringToHex(value){
        let hex = '';
        let tmp = '';

        for (let i = 0; i < value.length; i++){
            tmp = ('0000' + value.charCodeAt(i).toString(16)).slice(-2);
            hex += '' + tmp;
        }
        return hex
    }

    static hexToInt(value){
        return parseInt(value, 16);
    }

    static intToHex(value){
        return parseInt(value).toString(16);
    }

    static pad(value, total){
        value = value + '';
        while(value.length < total){
            value = '0' + value;
        }
        return value
    }

    generate(secret){
        secret = base32.decode(secret).toString('binary');
        let epoch = new Date().getTime();
        let timeStep = 30;
        let timeCounter = Math.floor(epoch / (timeStep * 1000.00));
        let expiry = timeStep - Math.floor(epoch % timeCounter / 1000.00);
        secret = Authenticator.stringToHex(secret);
        let counter = Authenticator.intToHex(timeCounter);
        counter = Authenticator.pad(counter, 16);
        let cryptoHmac = crypto.createHmac('sha1', new Buffer(secret, 'hex'));
        let hmac = cryptoHmac.update(new Buffer(counter, 'hex')).digest('hex');
        let offset = Authenticator.hexToInt(hmac.substr(hmac.length - 1));
        let truncatedHash = hmac.substr(offset * 2, 8);
        let sigbit0 = Authenticator.hexToInt(truncatedHash) & Authenticator.hexToInt('7fffffff');
        let code = sigbit0 % Math.pow(10, 6);
        code = Authenticator.pad(code, 6);
        return [code, expiry]
    }
}


/**
 * Reads the .cerebro-otp file into the sites object.
 */
function readFile(){
    var fs = require('fs');
    fs.readFile(require('os').homedir() + '/.cerebro-otp', 'utf8', function(err, data) {
        if (err) {
            throw err;
        } else {
            var lines = data.split('\n');
            for (var line in lines){
                if (!lines[line]){break};
                var split = lines[line].split(' ');
                var site = split[0];
                var secret = split[1];
                sites[site] = secret;
             }
        }
    });
}

/**
 * Runs the Authenticator to generate a code for a site, 
 * displays the code if successful, error message if not.
 * @param {string} site - Name of the site to generate code for.
 * @param {string} id - ID of the display object; refreshes an existing display object if not null.
*/
const auth = new Authenticator();
function generateCodeCard(site, id){
    var [code, expiry] = auth.generate(sites[site]);
    if (code){
        D(renderDisplayCode(site, code, expiry, id));
    } else {
        D(renderDisplayError('Error generating code', 'Something went wrong generating the OTP code'));
    }
    };

/**
 * Returns the display object for a generated code for a site.
 * @param {string} site - Name of the site.
 * @param {string} code - Generated code.
 * @param {integer} id - Time in seconds before the code expires.
 * @param {string} id - ID of the display object; refreshes an existing display object if not null.
 */
function renderDisplayCode(site, code, exp, id){
    var CountdownTimer = React.createClass({
      getInitialState: function() {
        return {
          secondsRemaining: 0
        };
      },
      tick: function() {
        this.setState({secondsRemaining: this.state.secondsRemaining - 1});
        if (this.state.secondsRemaining <= 0) {
          generateCodeCard(site, id);
        }
      },
      componentDidMount: function() {
        this.setState({ secondsRemaining: this.props.secondsRemaining });
        this.interval = setInterval(this.tick, 1000);
      },
      componentWillUnmount: function() {
        clearInterval(this.interval);
      },
      render: function() {
        return (
          <div>Expires in: {this.state.secondsRemaining}</div>
        );
      }
    });

    return {
        id: id,
        icon: icon,
        title: site,
        clipboard: code,
        onSelect: (event) => A.copyToClipboard(code),
        getPreview: () => (
            <div style={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            textAlign: 'center',
            padding: '15px',
            boxSizing: 'border-box'
            }}>
            <span>Code for {site}:</span><br />
            <span style={{fontSize: '200%'}}>{code}</span><br /><br />
            <span id='output' style={{fontSize: '80%'}}><CountdownTimer secondsRemaining={exp} /></span>
            <span style={{fontSize: '80%'}}>Press Enter to copy to clipboard</span>
            </div>
        )
    }
};

/**
 * Returns the display object to show a site in a list of all sites.
 * @param {string} site - Name of the site.
 */
function renderDisplayAll(site){
    return {
        icon: icon,
        title: site,
        subtitle: 'Select to generate',
        onSelect: (event) => {event.preventDefault(); A.replaceTerm('otp ' + site)},
    }
};

/**
 * Returns the display object for an error message.
 * @param {string} error - Error title.
 * @param {string} errorText - Error text to show in the preview pane.
 */
function renderDisplayError(error, errorText){
    return {
        icon: icon,
        title: 'OTP Plugin error',
        subtitle: error,
        getPreview: () => (
            <div style={{
            maxWidth: '100%',
            wordWrap: 'break-word',
            textAlign: 'center',
            padding: '15px',
            boxSizing: 'border-box'
            }}>
            {errorText}
            </div>
        )

    }
};

/**
 * Main plugin object. Matches input against regex and displays all sites or a code for a single site.
 */
const fn = ({ term, display, actions }) => {
    D = display;
    A = actions;
    const regex = /(^otp)\s?(\S*)/g;
    const match = regex.exec(term.toLowerCase());
    if (match && match[1] && !match[2]) {
        if (Object.keys(sites).length === 0) {D(renderDisplayError('.cerebro-otp file not found or empty'))};
        D(Object.keys(sites).map((site) => {
            return renderDisplayAll(site)
        }
        ));
    } else if (match && match[1] && match[2]){
        if (match[2] in sites){
            const site = match[2];
            generateCodeCard(site, null);
        }
    }
};
module.exports = { fn: fn, name: 'Generate OTP codes', keyword: 'otp' }
