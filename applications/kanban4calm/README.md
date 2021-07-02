## CALMKanban
 
### Intro
This is a sample application using the SAP Cloud ALM APIs for Project and Task Management, building a very simple Kanban Board using JQuery and Bootstrap. The backend part is a very simple NodeJS application, that serves the HTML component and acts as proxy to the actual API's handling the OAuth2 authorization with client_id and client_secret. The NodeJS application can either run as a standalone application, or it can be published to a CloudFoundry instance on SAP BTP:

### Structure
Another
´´´

                                                   +----------------------------------+                                          
                                                    |                                  |                                          
+--------------------------------------+            |                                  |                                          
|                                      |            |                                  |                                          
|        Authentication Service        |            |                                  |                                          
|                                      |            |                                  |                                          
|                                      |            |        Cloud Foundry Instance    |                                          
|                                      <-------+    |                                  |                   +---------------------+
|                                      |       |    |                                  |                   |                     |
+--------------------------------------+       |    |                                  |                   |      Browser        |
                                               |    |                                  |                   |                     |
                                               |    |         +-------------------+    |                   |                     |
   +----------------------------+              |    |         |                   |    |                   |                     |
   |                            |              |    |         |                   |    |                   |                     |
   |                            |              +--------------|                   |    |                   |      Bootstrap      |
   |      SAP Cloud ALM         |                   |         |                   |    |                   |        JQuery       |
   |                            |                   |         |    Node.JS        |    |                   |                     |
   |      Customer Tenant       |                   |         |                   |    |                   |                     |
   |                            |                   |         |    Server App     |    |                   +---------------------+
   |                            |                   |         |                   |    |                                          
   |                            |                   |         |                   |    |                                          
   +----------------------------+                   |         |                   |    |                                          
                                                    |         |                   |    |                                          
                                                    |         +-------------------+    |                                          
                                                    |                                  |                                          
                                                    |                                  |                                          
                                                    |                                  |                                          
                                                    |                                  |                                          
                                                    |                                  |                                          
                                                    +----------------------------------+                                          
                                                                                                       
´´´
