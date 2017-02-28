var mailin = require('mailin');
var request = require('request');

var webhookurl = process.env.SLACK_WEBURL;

/* Start the Mailin server. The available options are:
 *  options = {
 *     port: 25,
 *     webhook: 'http://mydomain.com/mailin/incoming,
 *     disableWebhook: false,
 *     logFile: '/some/local/path',
 *     logLevel: 'warn', // One of silly, info, debug, warn, error
 *     smtpOptions: { // Set of options directly passed to simplesmtp.createServer(smtpOptions)
 *        SMTPBanner: 'Hi from a custom Mailin instance',
 *        // By default, the DNS validation of the sender and recipient domains is disabled so.
 *        // You can enable it as follows:
 *        disableDNSValidation: false
 *     }
 *  };
 * Here disable the webhook posting so that you can do what you want with the
 * parsed message. */
 
 /*
 Things to do
 * minimize long errors on failed reports or find a way to fold them
 * separate messages from jobs and alerts
 * auto wrap messages that are long
 * add buttons for rptdocuments to be downloaded as PDF / XLS / Browser
 * upload attached files to slack
 * send alerts to admins
 * send jobs to user
 * new email template with more useful information
 * Add info from system console
 * add icons for report documents
  */
mailin.start({
  port: 25,
  logLevel: 'silly',
  logFile: 'log/logfile.txt',
  disableWebhook: true // Disable the webhook posting.
});

/* Access simplesmtp server instance. Emitted if requireAuthentication option is set to true. */
mailin.on('authorizeUser', function(connection, username, password, done) {
  if (username == "johnsmith" && password == "mysecret") {
    done(null, true);
  } else {
    done(new Error("Unauthorized!"), false);
  }
});

/* Event emitted when a connection with the Mailin smtp server is initiated. */
mailin.on('startMessage', function (connection) {
  /* connection = {
      from: 'sender@somedomain.com',
      to: 'someaddress@yourdomain.com',
      id: 't84h5ugf',
      authentication: { username: null, authenticated: false, status: 'NORMAL' }
    }
  }; */
  console.log(connection);
});

/* Event emitted after a message was received and parsed. */
mailin.on('message', function (connection, data, content) {
  console.log(data);
  /* Do something useful with the parsed message here.
   * Use parsed message `data` directly or use raw message `content`. */
   
   console.log('Sending response to Slack')
   var request = require('request');

//test data
/* var MESSAGE_DATA = {
   "attachments":[
      {
         "fallback":"New open task [Urgent]: <http://url_to_task|Test out Slack message attachments>",
         "pretext":"New open task [Urgent]: <http://url_to_task|Test out Slack message attachments>",
         "color":"#D00000",
         "fields":[
            {
               "title":"Notes",
               "value":"This is much easier than I thought it would be.",
               "short":false
            }
         ]
      }
   ]
}		
*/

//test data
if (data.subject.includes("Report Generated")) {
	//var firstline = data.text.substring(0,data.text.indexOf("\n"));
	//data.text = data.text.substring(data.text.indexOf("\n") + 1);
	//var exp = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi;
	//data.text = data.text.replace(exp, "<$1|Click here>");
	
	var reportVersion = data.text.match(/Version:(.*)\n/);
	var reportFilename = data.text.match(/Report name:(.*)\n/);
	var reportLink = data.text.match(/Access report:\s(.*)\n/);
	var reportSubmitter = data.text.match(/Submitter:(.*)\n/);
	
	var MESSAGE_DATA = {
   "attachments":[
      {
         "fallback":data.subject,
         "pretext":data.subject,
         "color":"#7CD197",
		 "title": reportFilename[1],
		 "title_link": reportLink[1],
         "fields":[
			{
               "title":"Version",
               "value":reportVersion[1],
               "short":true
            },
			{
               "title":"Submitter",
               "value":reportSubmitter[1],
               "short":true
            }
         ]
      }
   ]
}		
} else if (data.subject.includes("Report Failed")) {
	var firstline = data.text.substring(0,data.text.indexOf("\n"));
	data.text = data.text.substring(data.text.indexOf("\n") + 1);
	var exp = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi;
	data.text = data.text.replace(exp, "<$1|Click here>");
	
	var MESSAGE_DATA = {
   "attachments":[
      {
         "fallback":data.subject,
         "pretext":data.subject,
         "color":"#D00000",
         "fields":[
            {
               "title":firstline,
               "value":data.text,
               "short":false
            }
         ]
      }
   ]
}
} else if (data.subject.includes("Monitoring alert")) {	
	var alertSubject = data.subject.replace("Monitoring alert","Alert");
	var alertTrigger = data.text.match(/Trigger:(.*)\n/);
	var alertValue = data.text.match(/Trigger Value:(.*)\n/);
	var alertTime = data.text.match(/Timestamp:(.*)\n/);
	var alertVolume = data.text.match(/Volume:(.*)\n/);
	var alertServer = data.text.match(/Server:(.*)\n/);
	var alertProcess = data.text.match(/Process:(.*)\n/);
	var MESSAGE_DATA = {
   "attachments":[
      {
         "fallback":alertSubject,
         "pretext":alertSubject,
         "color":"#D00000",
         "fields":[
            {
               "title":alertValue[1],
               "value":alertTrigger[1],
               "short":false
            },
			{
               "title":"Volume",
               "value":alertVolume[1],
               "short":true
            },
			{
               "title":"Server",
               "value":alertServer[1],
               "short":true
            },
			{
               "title":"Process",
               "value":alertProcess[1],
               "short":true
            },
			{
               "title":"Timestamp",
               "value":alertTime[1],
               "short":true
            }
         ],
      }
   ]
}		
}
var options = {
    method: 'POST',
    url: 'https://hooks.slack.com/services/'+ webhookurl,
    headers: {
        'Content-Type': 'application/json'
    },
    json: MESSAGE_DATA
};
 console.log(JSON.stringify(MESSAGE_DATA));

function callback(error, response, body) {
    if (!error) {
        var info = JSON.parse(JSON.stringify(body));
        console.log(info);
    }
    else {
        console.log('Error happened: '+ error);
    }
}

//send request
request(options, callback);
                   

});