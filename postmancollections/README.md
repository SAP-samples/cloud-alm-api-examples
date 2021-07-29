# Postman collection for usage with SAP Cloud ALM APIs

This directory contains Postman collections to demonstrate use of SAP CLOUD ALM APIs.

The following collections are available:
- SAP Cloud ALM Projects and Tasks API


<br>

### SAP Cloud ALM Projects and Tasks API

- Import the Postman collection.
- Create an environment with the following variables from your SAP Cloud ALM tenant:
   - CLIENT_ID
   - CLIENT_SECRET
   - TOKEN_URL

- 3 Methods are accessible from the current of this collection

![image](https://user-images.githubusercontent.com/69521751/125978191-eed101a3-b088-4afa-8505-5fc931f56435.png)

 
   - **Projects**: Return all projects of your SAP Cloud ALM tenant.
   - **Tasks with projectId**:
     - Select a projectId GUID from the **Projects** method.
   - **Tasks**
     - Select an id GUID from the **Tasks with projectId** method.
