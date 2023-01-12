# How to use Postman Collection "SAP Cloud ALM Analytics Demo"

## With SAP API Business Hub Sandbox

*   Retrieve your apiKey from SAP API Business Hub (you need to be logged).

![](https://user-images.githubusercontent.com/79574318/212125431-899ba72b-a1b3-4730-89f3-b7c3f121803c.jpg)

*   Import the collection in Postman.
*   Select the top folder of the collection “CALM Analytics Demo”.
*   Select “Variables”.

![](https://user-images.githubusercontent.com/79574318/212134585-823f59c1-c4bf-4cae-af6e-80d76297934e.jpg)

*   Set current value of parameter “CALM\_DEMO\_API\_KEY” with your apiKey.
*   Make sure that parameters “CALM\_DEMO\_CLIENT\_ID” and "CALM\_DEMO\_CLIENT\_SECRET" current value is empty.
*   You are ready to use the collection against the SAP API Business Hub Sandbox: https://support.sap.com/en/alm/demo-systems/cloud-alm-demo-system.html

## With your own SAP Cloud ALM Tenant

*   Retrieve the service key from your SAP Cloud ALM BTP Tenant: [https://help.sap.com/docs/CloudALM/08879d094f3b4de3ac67832f4a56a6de/704b5dc854f549888a238f94015e1eac.html](https://help.sap.com/docs/CloudALM/08879d094f3b4de3ac67832f4a56a6de/704b5dc854f549888a238f94015e1eac.html)

![](https://user-images.githubusercontent.com/79574318/212134211-823a82c7-f679-4cca-8e14-5273c23c4e44.jpg)

*   Make sure the service key includes the needed scopes. You can check the scopes from SAP Help documentation "API Guide for SAP Cloud ALM": https://help.sap.com/docs/CloudALM/fe419bfabbdc46dfbddbfd78b21483d5/d012b5cdb3744372ada8018c6a570358.html
*   Import the collection in Postman.
*   Select the top folder of the collection “CALM Analytics Demo”.
*   Select “Variables”.
*   Set current value of parameter “CALM\_DEMO\_CLIENT\_ID” with your clientId.
*   Set current value of parameter “CALM\_DEMO\_CLIENT\_SECRET” with your clientSecret.
*   Set current value of parameter “CALM\_DEMO\_TOKEN\_URL” with your access token url. In SAP BTP region **eu10**, it should looks like: https://.authentication.eu10.hana.ondemand.com/oauth/token.
*   If your tenant is not located in SAP BTP region **eu10**, you must update the parameters "CALM\_DEMO\_CALM\_PREFIX".
*   You are ready to use the collection against your SAP Cloud ALM Tenant.
