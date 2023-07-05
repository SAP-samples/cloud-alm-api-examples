# SAP Cloud ALM Custom Content Upload Demo

This is an example to illustrate how you can use SAP Cloud ALM Custom Processes API. The code is not production ready and you use it on your own risk. :-)
Even though the Scoping API is actually built as batch oriented REST API, this example implements UI interactions. Overall the API is not intended to build UIs but rather synchronization scenarios.

You can find all the details about the SAP Cloud ALM Custom Processes API on the [SAP API Business Hub](https://api.sap.com/api/CALM_PMGE/overview).

## Install libraries

[Sad but true.](https://www.monkeyuser.com/2017/npm-delivery/)

Navigate to CustomProcessUpload folder, and then

> npm install
> 
## Credentials

Please make sure you have sufficient authorizations to call the APIs. 
The required authorisation scopes, to run the sample, are:

* calm-api.processauthoring.read: Read process authoring entities.
* calm-api.processauthoring.write: Write process authoring entities.
* calm-api.projects.read: to view projects.

To learn how generate needed client id and secret please check this [blog](https://blogs.sap.com/2021/08/12/sap-cloud-alm-extend-with-api-get-started-with-sap-cloud-alm-api/).

## Run the script

> node index.js

Please check the logs in the log directory.

Have fun.