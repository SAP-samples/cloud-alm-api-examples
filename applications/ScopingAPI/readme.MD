# SAP Cloud ALM Scoping API Sample

This is an example to illustrate how you can use SAP Cloud ALM Scoping API. The code is not production ready and you use it on your own risk. :-)
Even though the Scoping API is actually built as batch oriented REST API, this example implements UI interactions. Overall the API is not intended to build UIs but rather synchronization scenarios.

You can find all the details about the SAP Cloud ALM Scoping API on the [SAP API Business Hub](https://api.sap.com/api/CALM_PM/overview).

## Demo

Please find a recording [here](recording/2022-09-14_11-49-53.mp4).
## Install libraries

[Sad but true.](https://www.monkeyuser.com/2017/npm-delivery/)

Navigate to ScopingAPI folder, and then

> mkdir log && npm install

## Maintain credentials

You need to have a "secret.js"-file in the form as follows with valid data.

```
export default {
    //no trailing "/"
    "apiBaseUrl":           "<URL to your tenant>", 
    "authenticationUrl":    "<URL to your authentication service>",
    "clientId":             "<Your client id>",
    "clientSecret":         "<Your client secret>",
}
```
Please make sure you have sufficient authorizations to call the APIs. 
The required authorisation scopes, to run the sample, are:

* calm-api.processmanagement.read: to read process management entities.
* calm-api.processmanagement.write: to write process management entities.
* calm-api.processmanagement.delete: to delete process management entities.
* calm-api.projects.read: to view projects.


You can use the [service.json](service.json) example to generate keys in the BPT Cockpit. To learn how generate the needed client id and secret please check this [blog](https://blogs.sap.com/2021/08/12/sap-cloud-alm-extend-with-api-get-started-with-sap-cloud-alm-api/).

## Run the script

> node index.js

Please check the logs in the log directory to get insights in service timings.

Have fun.