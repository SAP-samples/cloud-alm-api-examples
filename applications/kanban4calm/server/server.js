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

var myToken;

app.use(express.static('static'));
app.use(express.json());


app.get('/test', function (req, res) {
  //See if the server is running and OAuth2 is working working...
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
      myToken = user.accessToken;
      const axiosConfig = {
        headers: { Authorization: `Bearer ${myToken}` }
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
      myToken = user.accessToken;
      //console.log("Access Token:", myToken);
      var second = require('request');

      const config = {
        headers: { Authorization: `Bearer ${myToken}` }
      };

      const bodyParameters = {
        projectId: "f5b25719-e1ab-4de7-be36-e58b119b693b",
        title: 'New Task',
        type: 'CALMTASK'
      };

      axios.post(
        CONFIG.api_baseurl + '/api/calm-tasks/v1/tasks/',
        bodyParameters,
        config
      ).then((response) => {
        console.log(response.data);
        res.send(response.data);
      }, (error) => {
        console.log('Error Code: ' + error.response.status);

        res.send(error.response.status, error.response.data);
        console.log(error);
      });
    });
});

app.patch('/editTask', function (req, res) {
  const url = require('url');
  const queryObject = url.parse(req.url, true).query;
  console.log(queryObject);

  console.log('Edit task called');

  console.log('Task ID: ' + queryObject.taskid);
  console.log('New Title: ' + req.body.title);

  //Perform OAuth Request to get Bearer Token
  calmAuth.credentials.getToken()
    .then(function (user) {

      //The access token is provided in the results of the OAuth request
      myToken = user.accessToken;

      const config = {
        headers: { Authorization: `Bearer ${myToken}` }
      };

      const bodyParameters = {
        title: req.body.title,
        status: req.body.status
      };
      var axios = require('axios');


      axios.patch(
        CONFIG.api_baseurl + '/api/calm-tasks/v1/tasks/' + queryObject.taskid,
        bodyParameters,
        config
      ).then((response) => {
        console.log(response.data);
        res.send(response.data);
      }, (error) => {
        console.log('Error Code: ' + error.response.status);

        res.send(error.response.status, error.response.data);
        console.log(error);

      });
    });
});

app.get('/gettasks', function (req, res) {
  
  const url = require('url');
  //console.log(req);
  const queryObject = url.parse(req.url, true).query;
  //console.log(queryObject);

  var tasks = [];

  //Perform OAuth Request to get Bearer Token
  calmAuth.credentials.getToken()
    .then(function (user) {

      //The access token is provided in the results of the OAuth request
      myToken = user.accessToken;
      //console.log("Access Token:", myToken);
      var second = require('request');
      second({
        url: CONFIG.api_baseurl + '/api/calm-tasks/v1/tasks?projectId=' + queryObject.projectid,
        auth: {
          'bearer': myToken
        }
      }, function (api_err, api_res) {
        //console.log(api_res.body);

        JSON.parse(api_res.body).forEach(element => {
          console.log(element);
          if (element.status == queryObject.status) {
            //console.log("SENT");
            tasks.push(element);
          }
        });

        ////console.log(tasks);
        res.send(tasks);
      });
    });

});
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('myapp listening on port ' + port);
  //console.log(process.env);
});


