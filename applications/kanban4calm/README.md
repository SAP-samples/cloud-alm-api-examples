## CALMKanban
 
### Intro
This is a sample application using the SAP Cloud ALM APIs for Project and Task Management, building a very simple Kanban Board using JQuery and Bootstrap. The backend part is a very simple NodeJS application, that serves the HTML component and acts as proxy to the actual API's handling the OAuth2 authorization with client_id and client_secret. The NodeJS application can either run as a standalone application, or it can be published to a CloudFoundry instance on SAP BTP:

### High-Level Architecture of the example application

![High Level Architecture](HL_Architecture.drawio.svg)


### How it works

The app consists mainly of three files
- [server/static/index.html](server/static/index.html) - Contains the client side code, a very simple bootstrap based application that uses SortableJS to create containers, fill them with tasks and manage the creation of new tasks, editing existing tasks and drap&drop to change the stauts
- [server/server.js](server/server.js) - Contains the server side code that serves the client side coding, handles OAuth2 authentification and making the actual API calls (incl. a bit of filtering here and there)
- [server/config.json](server/config.json) - Contains the URLs to the SAP Cloud ALM tenant API and the client credentials (client_id and client_secret) used for authentication. Please copy config.json.sample and adapt to you local needs

Additionally two supporting files:
- [server/package.json](server/package.json) - contains the required NodeJS modules, information on the runtime environment and the necessary NodeJS version to run it in CloudFoundry
- [manifest.yaml](manifest.yaml) - The manifest for pushing the application to a CloudFoundry environment [documentation can be found here](XXXXXXX)


From an application logic the server side application is just a proxy that handles the OAuth2 authentication and proxies the calls from the client to the API. It is alos used to filter the returned projects and tasks based on their status values (only open projects and only tasks for a specific status values), as this is not yet supported natively by the APIs

### How to run?

1. Clone this repository
2. Adapt configuration
3. Run
   - Run locally:
   - Run on Cloud Foundry: