How to use Postman Collection "SAP Cloud ALM Analytics Demo"

1) With SAP API Business Hub Sandbox

Retrieve your apiKey from SAP API Business Hub (you need to be logged).

![](https://user-images.githubusercontent.com/79574318/212125431-899ba72b-a1b3-4730-89f3-b7c3f121803c.jpg)

Select the top folder of the collection “CALM Analytics Demo”.

Select “Variables”.

Set current value of parameter “CALM_DEMO_API_KEY” with your apiKey.

Make sure that parameters “CALM_DEMO_CLIENT_ID” and "CALM_DEMO_CLIENT_SECRET" current value is empty.

You are ready to use the collection against the SAP API Business Hub Sandbox: https://support.sap.com/en/alm/demo-systems/cloud-alm-demo-system.html

2) With your own SAP Cloud ALM Tenant

Retrieve the service key from your SAP Cloud ALM BTP Tenant: https://help.sap.com/docs/CloudALM/08879d094f3b4de3ac67832f4a56a6de/704b5dc854f549888a238f94015e1eac.html

Make sure the service key includes the needed scopes. You can check the scopes from SAP Help documentation "API Guide for SAP Cloud ALM": https://help.sap.com/docs/CloudALM/fe419bfabbdc46dfbddbfd78b21483d5/d012b5cdb3744372ada8018c6a570358.html

Select the top folder of the collection “CALM Analytics Demo”.

Select “Variables”.

Set current value of parameter “CALM_DEMO_CLIENT_ID” with your clientId.

Set current value of parameter “CALM_DEMO_CLIENT_SECRET” with your clientSecret.

Set current value of parameter “CALM_DEMO_TOKEN_URL” with your access token url. On region eu10, it should looks like: https://<your-tenant>.authentication.eu10.hana.ondemand.com/oauth/token.

If your tenant is not located on region eu10, you must also update the parameters "CALM_DEMO_CALM_PREFIX".

You are ready to use the collection against your SAP Cloud ALM Tenant.

