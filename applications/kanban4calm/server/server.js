const express = require('express');
const app = express();
const { config } = require('process');

//Read credentials and API Urls from config.json file, see config.json.sample for details
var CONFIG = require('./config.json');

//Prepare OAuth2 request
var ClientOAuth2 = require('client-oauth2')
var calmAuth = new ClientOAuth2({
  clientId: CONFIG.client_id,
  clientSecret: CONFIG.client_secret,
  accessTokenUri: CONFIG.auth_url
})

app.use(express.static('static'));
app.use(express.json());

app.get('/test', function (req, res) {
  //See if the server is running and OAuth2 is working...
  res.send('Hello World!');

  //Perform OAuth2 call and log access token...
  calmAuth.credentials.getToken()
    .then(function (user) {
      console.log(user.accessToken) //=> { accessToken: '...', tokenType: 'bearer', ... }
    })

});


app.get('/getprojects', function (req, res) {
  var projects = [];

  console.log('Get Projects called');

  //Perform OAuth Request to get Bearer Token
  calmAuth.credentials.getToken()
    .then(function (user) {

      //The access token is provided in the results of the OAuth request
      const axiosConfig = {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      };

      //Using Axios for the actual API Calls
      var apiCall = require('axios');

      //Make the actual API Call using the OAuth token retrieved before
      apiCall.get(
        CONFIG.api_baseurl + '/api/calm-projects/v1/projects',
        axiosConfig
      ).then((apiResponse) => {
        //The response contains the JSON with the project details...
        //console.log(apiResponse.data);

        //Filter out projects that are not open (O = Open, C = Closed/Hidden)
        apiResponse.data.forEach(element => {
          if (element.status == 'O') {
            var data = {
              id: element.id,
              name: element.name
            };
            projects.push(data);
          }
        });
        res.send(projects);

      }, (apiError) => {
        //Hand over the error response from the API to the client
        console.log('Error Code: ' + apiError.response.status);

        res.send(apiError.response.status, error.response.data);
        console.log(apiError);
      });
    });
});


app.post('/createTask', function (req, res) {

  console.log('Create task called');
  //console.log(req.body);

  //Perform OAuth Request to get Bearer Token
  calmAuth.credentials.getToken()
    .then(function (user) {

      //The access token is provided in the results of the OAuth request
      const axiosConfig = {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      };

      //Using Axios for the actual API Calls
      var apiCall = require('axios');

      //Pass through the body parameters from the client to the API Call
      const bodyParameters = req.body;

      apiCall.post(
        CONFIG.api_baseurl + '/api/calm-tasks/v1/tasks/',
        bodyParameters,
        axiosConfig
      ).then((apiResponse) => {
        //console.log(apiResponse.data);
        res.send(apiResponse.data);
      }, (apiError) => {
        console.log('Error Code: ' + apiError.response.status);

        res.send(apiError.response.status, apiError.response.data);
        console.log(apiError);
      });
    });
});

app.patch('/editTask', function (req, res) {
  const url = require('url');
  const queryObject = url.parse(req.url, true).query;

  //console.log(queryObject);

  console.log('Edit task called');

  console.log('  Task ID: ' + queryObject.taskid);
  console.log('  New Title: ' + req.body.title);
  console.log('  New Status: ' + req.body.status);

  //Perform OAuth Request to get Bearer Token
  calmAuth.credentials.getToken()
    .then(function (user) {

      //The access token is provided in the results of the OAuth request
      const axiosConfig = {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      };

      const bodyParameters = {
        title: req.body.title,
        status: req.body.status
      };

      var apiCall = require('axios');

      apiCall.patch(
        CONFIG.api_baseurl + '/api/calm-tasks/v1/tasks/' + queryObject.taskid,
        bodyParameters,
        axiosConfig
      ).then((apiResponse) => {
        //console.log(apiResponse.data);
        res.send(apiResponse.data);
      }, (apiError) => {
        console.log('Error Code: ' + apiError.response.status);

        res.send(apiError.response.status, apiError.response.data);
        console.log(apiError);

      });
    });
});

app.get('/gettasks', function (req, res) {

  const url = require('url');
  const queryObject = url.parse(req.url, true).query;

  console.log('Get Tasks called');

  var tasks = [];

  //Perform OAuth Request to get Bearer Token
  calmAuth.credentials.getToken()
    .then(function (user) {

      //The access token is provided in the results of the OAuth request
      const axiosConfig = {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      };

      var apiCall = require('axios');
      apiCall.get(
        CONFIG.api_baseurl + '/api/calm-tasks/v1/tasks?projectId=' + queryObject.projectid,
        axiosConfig
      ).then((apiResponse) => {
        //The response contains the JSON with the project details...
        //console.log(apiResponse.data);

        //Filter out tasks with the wrong status
        apiResponse.data.forEach(element => {
          //console.log(element);
          if (element.status == queryObject.status) {
            //console.log("SENT");
            tasks.push(element);
          }
        });

        //send results
        //console.log(tasks);
        res.send(tasks);

      }, (apiError) => {
        //Hand over the error response from the API to the client
        console.log('Error Code: ' + apiError.response.status);

        res.send(apiError.response.status, error.response.data);
        console.log(apiError);
      });
    });
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost'
app.listen(port, function () {
  console.log('kanban4calmserver listening on port ' + port);
  console.log('to access the application use http://' + host + ':'+ port)
  //console.log(process.env);
});


