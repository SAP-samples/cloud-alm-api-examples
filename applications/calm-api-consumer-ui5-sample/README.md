# SAP Cloud ALM Extend with APIs


## Description
This SAPUI5 custom application has been developed on SAP BTP platform and serves as an example of what it is possible to achieve with the [SAP Cloud ALM Rest APIs](https://api.sap.com/package/SAPCloudALM/rest). Indeed, only two of the four offered APIs ([Projects](https://api.sap.com/api/CALM_PJM/overview) and [Tasks](https://api.sap.com/api/CALM_TKM/overview)) are used to realize this application, but many other possibilities are available with the full set of provided APIs.

With this application, the user will be able to consult all projects that are defined in SAP Cloud ALM for implementation. He will be able to manage all tasks part of a project:
- display tasks within a Kanban view.
- add a task to a project, modify its content, or even delete it.
- change a task status using drag and drop capabilities of SAPUI5.
An additional feature offered by this application is a statistical view that gives a task distribution overview chart (for a given project) based on the task due date (On time vs Overdue tasks). Figures are computed on-the-fly and asynchronously when retrieving the tasks list from the Rest APIs.

**You will find in this README.md file all the information you need to run this app.**

## Prerequisites
 *Skip those parts if you already have everything, you can go to [Download and installation](#IMPORT)*
- Have a working SAP BTP Cockpit environement
- Have a working SAP Business Application Studio *(see explanation below)*
- [Have a valid Cloud ALM instance with API Keys](https://blogs.sap.com/2021/08/12/sap-cloud-alm-extend-with-api-get-started-with-sap-cloud-alm-api/)

#### Subscribe and run the Dev Space Manager in SAP Business Application Studio 
To open the SAP Business Application Studio, go in your SAP BTP Cockpit:

<img src="https://user-images.githubusercontent.com/54988908/133410006-e071bb89-8d2c-4daf-acf7-70ad1630b912.PNG" alt="access_ sap_ business_ app_ studio" width="40%"/>

From that, create a dev space by clicking on the *Create Dev Space* button and choosing a space for Full Stack Cloud Applications. You can now start it with the associated button you will see on the right. It can take some time but when it displays `STARTED`, its name becomes clickable and you can enter it.

When it is opened, do not forget to connect to your Cloud Foundry account. Here are the steps to do it: 
-	Open the preferences (bottom left of the screen)
-	Search “cloud foundry” in the search bar
-	Check the “Display the current Cloud Foundry target information in the status bar” checkbox
-	Click on “Connect to CF” in the bottom left corner
-	Fill in the successive fields with the right information for your subaccount (at the top of the screen)
-	On the bottom left corner is now written your BTP tenant.


## Download and installation <a name="IMPORT"></a>
- [Create destinations in your BTP Cockpit](#destinations)
- [Clone this repository in your workspace](#importProject)
- [Install dependencies and build](#builds)
- [Run locally](#local)
- [Deploy and run in the BTP Cockpit](#deploy)


#### 1. Create destinations in your BTP Cockpit <a name="destinations"></a>

As explained before, you need to create two speciific destnations to run the application correctly. Connect to your SAP BTP Cockpit account, select one of your subaccounts and click on *Destinations* in the ***Connectivity*** section of the left menu. Click on *"New Destination"* to create each destination as in the images below :

<img src="https://user-images.githubusercontent.com/54988908/133401069-792178fc-f18e-4928-abef-25d1b2f86405.PNG" alt="cloudalmapi_sandbox" width="70%"/>
<img src="https://user-images.githubusercontent.com/54988908/133401208-6ced3cc1-8c73-4030-9045-66a5318835ae.PNG" alt="cloudalmapi" width="70%"/>

*The URL field should follow this template : https://{region}.alm.cloud.sap/ with the {region} parameter corresponding to the acronym of the region of the servers that host your cloud foundry account*.

#### 2. Clone this repository in your workspace <a name="importProject"></a>
Open a Dev Space in your Dev Space Manager and then, from the "Welcome" menu, click on "Clone from git". You can now fill the field at the top (*"Provide Repository URL"*) and fill the needed fields until it is done.
<img src="https://user-images.githubusercontent.com/54988908/133288412-abce337a-f0d8-48b7-a164-217cb880ecf6.PNG" alt="welcome menu" width="70%"/>
#### 3. Install dependencies and build <a name="builds"></a>
In a terminal, go in the *webapp* directory, and run:
```
npm install
```
Then, among the NPM Scripts (on the left of your screen in the SAP Business Application Studio), right click on the ***build*** script and run it.
Once the task is finished, you can also run the ***build:mta*** script. It builds a MTA Archive that you can deploy later in your BTP Cockpit if you want to.

#### 4. Run locally <a name="local"></a>
Go in the *Run Configurations* tab in SAP Business Application Studio, and create a new configuration. 
You must set up the configuration at the top of the screen: 
-	Select your app,
-	For the UI5 version, select *Latest*,
-	For the Destination Type, select *Connect to SAP System*,
-	Choose one of the two destinations (it doesn't matter which one),
-	Enter the name of your configuration

You now have to modify the ***launch.json*** file. In order to open the file, right click on your configuration and select *Show in file*. Now, you will have to change the Linux configuration, because SAP Business Application Studio runs on a linux like environment. In the "args" field, change the last argument (should be the line 18) to :
```JSON
"[{\"path\":\"/cloudalmapi\",\"pathPrefix\":\"/api\",\"destination\":\"cloudalmapi\"}, {\"path\":\"/SAPCALM\",\"pathPrefix\":\"/SAPCALM\",\"destination\":\"cloudalmapi_sandbox\"}]"
```

#### 5. Deploy and run in the BTP Cockpit<a name="deploy"></a>
In the file explorer (on the left of your screen in the SAP Business Application Studio), open the ***mta_archives*** directory and right click on the *archive.mtar* file. Then, select *Deploy MTA Archive*. Wait for the task to finish and you can now find your app in your BTP Cockpit.
