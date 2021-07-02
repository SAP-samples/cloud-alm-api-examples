const express = require('express');
const app = express();
var CONFIG = require('./config.json');
const { config } = require('process');

var myToken;

app.use(express.static('static'));
app.use(express.json());


app.get('/test', function (req, res) {
  res.send('Hello World!');
});

app.get('/getprojects', function (req, res) {
  var request = require('request');

  var projects = [];

  request({
    url: CONFIG.auth_url,
    method: 'POST',
    auth: {
      user: CONFIG.client_id,
      pass: CONFIG.client_secret
    },
    form: {
      'grant_type': 'client_credentials'
    }
  }, function (token_err, token_res) {
    var json = JSON.parse(token_res.body);
    myToken = json.access_token;
    //console.log("Access Token:", myToken);
    var second = require('request');
    second({
      url: CONFIG.api_baseurl + '/api/calm-projects/v1/projects',
      auth: {
        'bearer': myToken
      }
    }, function (api_err, api_res) {
      //console.log(api_res.body);

      JSON.parse(api_res.body).forEach(element => {
        //console.log(element);
        if (element.status == 'O') {
          var data = {
            id: element.id,
            name: element.name
          };
          //console.log(data);

          projects.push(data);
        }
      });

      //console.log(projects);
      res.send(projects);
    });
  });
});


app.post('/createTask', function (req, res) {

  console.log('Create task called');

  var request = require('request');

  console.log(req.body);

  request({
    url: CONFIG.auth_url,
    method: 'POST',
    auth: {
      user: CONFIG.client_id,
      pass: CONFIG.client_secret
    },
    form: {
      'grant_type': 'client_credentials'
    }
  }, function (token_err, token_res) {

    var json = JSON.parse(token_res.body);
    myToken = json.access_token;
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
    var axios = require('axios');

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

  var request = require('request');
  request({
    url: CONFIG.auth_url,
    method: 'POST',
    auth: {
      user: CONFIG.client_id,
      pass: CONFIG.client_secret
    },
    form: {
      'grant_type': 'client_credentials'
    }
  }, function (token_err, token_res) {

    var json = JSON.parse(token_res.body);
    myToken = json.access_token;
    //console.log("Access Token:", myToken);

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
  var request = require('request');

  const url = require('url');
  //console.log(req);
  const queryObject = url.parse(req.url, true).query;
  //console.log(queryObject);

  var tasks = [];



  request({
    url: CONFIG.auth_url,
    method: 'POST',
    auth: {
      user: CONFIG.client_id,
      pass: CONFIG.client_secret
    },
    form: {
      'grant_type': 'client_credentials'
    }
  }, function (token_err, token_res) {
    var json = JSON.parse(token_res.body);
    myToken = json.access_token;
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


