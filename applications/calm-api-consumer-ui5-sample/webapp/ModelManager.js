sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/ui/base/EventProvider",
    "sap/ui/model/json/JSONModel"
], function (BaseObject, MessageBox, EventProvider, JSONModel) {

    // Variable to save the Id of the project selected
    var currentProjectId;

    // Then we make this ModelManager able to create and fire his own 
    // events by making it inherit from the EventProvider class
    return EventProvider.extend("sap.ui.demo.cloudalmapi.ModelManager", {

        /**
         * As the ModelManager must be accessible by all  controllers, the component of the 
         * application is passed in parameter to be binded to the component of the ModelManager.
         *
         *  Then we apply the EventProvider to the ModelManager.
         * @param {sap.ui.core.Component} component 
         */
        constructor: function (component) {
            this.component = component;
            EventProvider.apply(this, arguments);
        },
        

        /**
         * Here we attach methods to the "project" and "task" model when a request failed or is 
         * completed to refresh the model (completed case) or to display a error message (failed case). 
         */
        init: function () {

            var projects = this.component.getModel("project");
            projects.attachRequestCompleted(function () {
                this.flushTasks();                              // Clean the tasks to avoid displaying previous project's tasks in the kanban
                this.fireEvent("requestLoadProjectsEnd", {});   // Fire event to disable the busy indicator in the project list
            }.bind(this));
            projects.attachRequestFailed(this.errorOnLoadingProjects.bind(this)); // display error message

            var tasks = this.component.getModel("task");
            tasks.attachRequestCompleted(function () {
                this.refreshTasks();                           // Reload the task in success case
            }.bind(this));
            tasks.attachRequestFailed(this.errorOnLoadingTasks.bind(this)); // display task error

            var infoTask = this.component.getModel("infoTask");
            infoTask.attachRequestCompleted(function () {
                this.fireEvent("requestLoadInfoTaskEnd", {});
            }.bind(this));
            infoTask.attachRequestFailed(this.errorOnLoadingInfoTask.bind(this)); // display task error
        },

        
        //////////////////////////////////////////////// GETTERS ////////////////////////////////////////////////

        /**
         * Return the id of the project currently selected.
         */
        getCurrentProjectId : function() {
            return this.currentProjectId; 
        }, 

        //////////////////////////////////////////////// EVENT HANDLING ////////////////////////////////////////////////

        // functions to attach event to others functions in the controllers

        // Notify that the variable currentProjectId has changed
        attachCurrentProjectIdChange : function(oData, fnFunction, oListener) {
            this.attachEvent("CurrentProjectIdChange", oData, fnFunction, oListener);
            return this;
        },

        detachCurrentProjectIdChange : function(oData, fnFunction, oListener) {
            this.detachEvent("CurrentProjectIdChange", oData, fnFunction, oListener);
            return this;
        },

        // Notify that the kanbanController begins to load the "task" model from the API 
        attachRequestLoadTasksStart: function (oData, fnFunction, oListener) {
            this.attachEvent("requestLoadTasksStart", oData, fnFunction, oListener);
            return this;
        },

        detachRequestLoadTasksStart: function (oData, fnFunction, oListener) {
            this.detachEvent("requestLoadTasksStart", oData, fnFunction, oListener);
            return this;
        },

        // Notify that the kanbanController has finished loading the "task" model from the API 
        attachRequestLoadTasksEnd: function (oData, fnFunction, oListener) {
            this.attachEvent("requestLoadTasksEnd", oData, fnFunction, oListener);
            return this;
        },

        detachRequestLoadTasksEnd: function (oData, fnFunction, oListener) {
            this.detachEvent("requestLoadTasksEnd", oData, fnFunction, oListener);
            return this;
        },

        // Notify that the kanbanController begins to load the "project" model from the API 
        attachRequestLoadProjectsStart: function (oData, fnFunction, oListener) {
            this.attachEvent("requestLoadProjectsStart", oData, fnFunction, oListener);
            return this;
        },

        detachRequestLoadProjectsStart: function (oData, fnFunction, oListener) {
            this.detachEvent("requestLoadProjectsStart", oData, fnFunction, oListener);
            return this;
        },

        // Notify that the kanbanController has finished loading the "project" model from the API 
        attachRequestLoadProjectsEnd: function (oData, fnFunction, oListener) {
            this.attachEvent("requestLoadProjectsEnd", oData, fnFunction, oListener);
            return this;
        },

        detachRequestLoadProjectsEnd: function (oData, fnFunction, oListener) {
            this.detachEvent("requestLoadProjectsEnd", oData, fnFunction, oListener);
            return this;
        },

        // Notify that there has been an error loading the "project"model
        attachRequestLoadProjectsError: function (oData, fnFunction, oListener) {
            this.attachEvent("requestLoadProjectsError", oData, fnFunction, oListener);
            return this;
        },

        detachRequestLoadProjectsError: function (oData, fnFunction, oListener) {
            this.detachEvent("requestLoadProjectsError", oData, fnFunction, oListener);
            return this;
        },

        // Notify that the kanbanController begin to load the "infoTask" model from the API
        attachRequestLoadInfoTaskStart: function(oData, fnFunction, oListener) {
            this.attachEvent("requestLoadInfoTaskStart", oData, fnFunction, oListener); 
            return this;
        }, 

        detachRequestLoadInfoTaskStart: function(oData, fnFunction, oListener) {
            this.detachEvent("requestLoadInfoTaskStart", oData, fnFunction, oListener); 
            return this;
        }, 

        // Notify that the kanbanController end to load the "infoTask" model from the API
        attachRequestLoadInfoTaskEnd: function(oData, fnFunction, oListener) {
            this.attachEvent("requestLoadInfoTaskEnd", oData, fnFunction, oListener); 
            return this;
        }, 

        detachRequestLoadInfoTaskEnd: function(oData, fnFunction, oListener) {
            this.detachEvent("requestLoadInfoTaskEnd", oData, fnFunction, oListener); 
            return this;
        }, 

        // Notify that the kanban controller has failed to load the "infoTask" model
         attachRequestLoadInfoTaskError: function(oData, fnFunction, oListener) {
            this.attachEvent("requestLoadInfoTaskError", oData, fnFunction, oListener); 
            return this;
        }, 

        detachRequestLoadInfoTaskError: function(oData, fnFunction, oListener) {
            this.detachEvent("requestLoadInfoTaskError", oData, fnFunction, oListener); 
            return this;
        }, 

        //////////////////////////////////////// ERROR HANDLING ////////////////////////////////////////

        /**
         * Display error dialog when loading projects failled.
         * @param {Event} oEvent : event with the error information that we will display 
         */
        errorOnLoadingProjects: function (oEvent) {
            this.flushProjects();
            this.fireEvent("requestLoadProjectsError", {});
            MessageBox.error(oEvent.getParameter("statusCode") + " " + oEvent.getParameter("statusText") + " \n" + this.component.getModel("i18n").getProperty("errorMsgProjects"), {
                icon: MessageBox.Icon.ERROR,
                title: "Could not load Cloud ALM Projects API"
            });
        },

        /**
         * Display error dialog when loading tasks failled.
         * @param {Event} oEvent : event with the error information that we will display 
         */
        errorOnLoadingTasks: function (oEvent) {
            this.flushTasks();
            MessageBox.error(oEvent.getParameter("statusCode") + " " + oEvent.getParameter("statusText"), {
                icon: MessageBox.Icon.ERROR,
                title: "Could not load Cloud ALM Tasks API"
            });
        },

        errorOnLoadingInfoTask: function (oEvent) {
            this.fireEvent("requestLoadInfoTaskError", {});
            MessageBox.error(oEvent.getParameter("statusCode") + " " + oEvent.getParameter("statusText"), {
                icon: MessageBox.Icon.ERROR,
                title: "Could not load this task"
            });
        },

        //////////////////////////////////////////////// ROUTING CONFIGURATION ////////////////////////////////////////////////

        /**
         * Update the destination saved in the ModelManager.
         * @param {String} destination 
         */
        setDestination: function (destination) {
            this.mDestination = destination;
            this.flushTasks();
        },

        /**
         * Return the URL to use according to the fact that the "sandbox" or "production" environement is selected 
         */
        getBaseUrl: function () {
            if (this.mDestination == "Sandbox") return ("SAPCALM");
            else return ("cloudalmapi");
        },

        //////////////////////////////////////////////// REST REQUESTS -- API MODELS GENERATION ////////////////////////////////////////////////

        /**
         * Perform the call to the CALM API and update the "project" model.
         */
        getProjects: function () {
            var oModel = this.component.getModel("project");
            var sHeaders = { "DataServiceVersion": "2.0", "Accept": "application/json", "Content-Type": "application/json", "APIKey": "NyhUxpfiJIG9PsIdzXnAGl4OWhZsXu6l" };

            // Event to trigger the busy indicators for the projects in the UI            
            this.fireEvent("requestLoadProjectsStart", {});
            // Sending request
            oModel.loadData(this.getBaseUrl() + "/calm-projects/v1/projects", null, true, "GET", null, true, sHeaders);
        },

        /**
         * Perform the call to the CALM API and update the "task" model. 
         * @param {String} project : id of the project which we want to recover.
         */
        getTasks: function (project) {

            // Check that the "project" varible is not empty.
            if (project) {
                // If the currentProjectId is null, then we must to fire an event to 
                // notify the kanaban controller that a project is selected (then he could enable the addTask button)
                if(!this.currentProjectId){
                    this.fireEvent("CurrentProjectIdChange", {projectSelected : true});
                }
                // As we must save the id of a project selected (later for the PATCH requests), 
                // we keep, this id in the member variable currentProjectId. 
                this.currentProjectId = project.toString();
            } else if (!this.currentProjectId) {
                // This must never happen 
                return;
            }

            var oModel = this.component.getModel("task");

            var sHeaders = { "DataServiceVersion": "2.0", "Accept": "application/json", "Content-Type": "application/json", "APIKey": "NyhUxpfiJIG9PsIdzXnAGl4OWhZsXu6l" };
            var parameter = { "projectId": this.currentProjectId };

            // Event to trigger the busy indicators for the task in the UI     
            this.fireEvent("requestLoadTasksStart", {});
            // Sending request
            oModel.loadData(this.getBaseUrl() + "/calm-tasks/v1/tasks", parameter, true, "GET", null, true, sHeaders);

        },

        getInfoTask: function(idTask){
            console.log("idOfTheTask :", idTask); 
            var oModel = this.component.getModel("infoTask");
            var sHeaders = { "DataServiceVersion": "2.0", "Accept": "application/json", "Content-Type": "application/json", "APIKey": "NyhUxpfiJIG9PsIdzXnAGl4OWhZsXu6l" };
            const URL = this.getBaseUrl() + "/calm-tasks/v1/tasks/" + idTask; 
            console.log("URL :", URL); 
            this.fireEvent("requestLoadInfoTaskStart", {});
            oModel.loadData(URL , true, "GET", null, true, sHeaders);
            
            console.log("Task infos :", oModel); 
        }, 

        //////////////////////////////////////// CUSTOM MODELS GENERATION ////////////////////////////////////////

        /**
         * Method to create the "tasksStatistic" model form the "task" model.
         * The "tasksStatistic" model is use by the pie chart in the UI.
         */
        generateStatisticModel: function () {
            /**   
             * get the task which are overdues.
             * this is a table with :
             *     index 0: number of tasks all
             *     index 1: number of tasks in time
             *     index 2: number of tasks Overdue
             *     index 3: number of null entry in the due dates
            */
            
            var tasks = this.calculateTasksOverdue();

            var oModel = this.component.getModel("tasksStatistic");

            // creation of the model,
            // we calculate the percentage of each type of task
            var data = [{
                "StatusName": "On time",
                "Percentage": tasks[1] / tasks[0]
            }, {
                "StatusName": "Overdue",
                "Percentage": tasks[2] / tasks[0]
            }, {
                "StatusName": "No due date",
                "Percentage": tasks[3] / tasks[0]
            }];
            oModel.setData(data);

            // We set the model of the component 
            this.component.setModel(oModel);
            oModel.refresh(true);
        },

        /**
         * Method to create the "kanbanModel" model form the "task" model.
         * The "kanbanModel" model is use by the kanban in the UI (and the Kanban.controller.js).
         */
        generateKanbanModel: function () {
            var oModel = this.component.getModel("kanbanModel");
            var tasks = this.component.getModel("task").getProperty("/");

            // the kanbanModel is composed by 4 tables, one for each stastus of a task.
            var openTasks = [];
            var blockedTasks = [];
            var inProgressTasks = [];
            var doneTasks = [];

            // We go through the tasks and sort them in the corresponding table.
            for (var i = 0; i < tasks.length; i++) {

                switch (tasks[i].status) {
                    case "CIPTKOPEN":
                        openTasks.push(tasks[i]);
                        break;
                    case "CIPUSOPEN":
                        openTasks.push(tasks[i]);
                        break;
                    case "CIPTKINP":
                        inProgressTasks.push(tasks[i]);
                        break;
                    case "CIPUSINP":
                        inProgressTasks.push(tasks[i]);
                        break;
                    case "CIPTKBLK":
                        blockedTasks.push(tasks[i]);
                        break;
                    case "CIPUSBLK":
                        blockedTasks.push(tasks[i]);
                        break;
                    case "CIPTKCLOSE":
                        doneTasks.push(tasks[i]);
                        break;
                    case "CIPUSCLOSE":
                        doneTasks.push(tasks[i]);
                        break;
                }
            }

            // then we update each table of the "kanbanModel"
            oModel.setProperty("/open", openTasks);
            oModel.setProperty("/in_progress", inProgressTasks);
            oModel.setProperty("/blocked", blockedTasks);
            oModel.setProperty("/done", doneTasks);

            oModel.refresh(true);
        },

        //////////////////////////////////////////////// UTILS ////////////////////////////////////////////////

        /**
         * Refresh the Task model and the models that depend on it (TasksStatistics and KanbanModel)
         * Triggered by a button in the ui
         * @param {Event} oEvent 
         */
        refreshTasks: function (oEvent) {
            this.generateStatisticModel();
            this.generateKanbanModel();
            this.fireEvent("requestLoadTasksEnd", {});
        },

        /**
         * Flush the Task model
         * Called when the user unselects the selected project or when thre is an error loading the Task API
         */
        flushTasks: function () {

            // Emptying the model
            var oModel = this.component.getModel("task");
            oModel.setProperty("/", []);
            oModel.refresh(true);

            this.currentProjectId = null; // Because the function is called when no model is selected
            this.fireEvent("CurrentProjectIdChange", {projectSelected : false});

            // Refresh the models that depends on the Task model
            this.refreshTasks();
        },

        /**
         * Empty the Project model
         * Called when there is an error loading the Project API
         */
        flushProjects: function () {
            var oModel = this.component.getModel("project");
            oModel.setProperty("/", []);
            oModel.refresh(true);
            this.flushTasks();
        },

        /**
         * Calculate the number of Tasks which have an overdue due date
         * Only user by the function that generates the TasksStatistics model
         */
        calculateTasksOverdue: function () {
            var tasks = this.component.getModel("task").getProperty("/");

            // Initializing variables
            var tasksOverdue = 0;
            var tasksWithoutDate = 0;
            var tasksOnTime = 0;
            var tasksNotDone = 0;

            // Determinating the current date
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var yyyy = today.getFullYear();

            today = yyyy + '-' + mm + '-' + dd;

            // Counting the number of overdue tasks, undone tasks, on time tasks...
            for (var i = 0; i < tasks.length; i++) {
                // Count only if the task is not finished yet
                if (tasks[i].status != "CIPUSCLOSE" && tasks[i].status != "CIPTKCLOSE") {
                    tasksNotDone++;
                    if (tasks[i].dueDate == null) tasksWithoutDate++;
                    else if (today > tasks[i].dueDate) {
                        tasksOverdue++;
                    } else tasksOnTime++;
                }

            }

            return [tasksNotDone, tasksOnTime, tasksOverdue, tasksWithoutDate];
        },

        //////////////////////////////////////////////// MODEL MODIFICATIONS ////////////////////////////////////////////////

        /**
         * Change a task status
         * Called when we drag and drop a task, to update its status
         * @param {uuid} idTask - The id of of the task we want to update
         * @param {string} status - The new status of the task we want to update
         */
        changeStatusTask(idTask, status){
            var parameterStatus = { "status": status };
            this.updateTask(idTask, parameterStatus); 
        },

        /**
         * Edit a task
         * Called when we fill an "edit" form
         * @param {uuid} idTask - The id of the task we want to update
         * @param {string} title - The new title of this task
         * @param {date} date - the new due date for this task
         * @param {int} priority - The new priority of this task
         * @param {string} description - A description about this task
         */
        editTask(idTask, title, date, priority, description){
            var parameters ={
                "title": title,
                "dueDate": date,
                "priorityId": priority,
                "description": description
            }
            this.updateTask(idTask, parameters); 
        }, 

        /**
         * Update a task (PATCH request)
         * Called by the changeStatusTask(...) and editTask(...) methods
         * @param {uuid} idTask - The id of the task we want to update
         * @param {json} parameters - A list of parameters listed in a Json variable (title, due date, descrption, priority)
         */
        updateTask(idTask, parameters) {
            var oModel = this.component.getModel("task");

            // Configuring the request url with the appropriate destination
            var url = this.getBaseUrl() + "/calm-tasks/v1/tasks/" + idTask;

            this.fireEvent("requestLoadTasksStart", {});

            //Sending request
            $.ajax({
                url: url,
                type: 'PATCH',
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(parameters),
                success: function (data) {
                    oModel.refresh(true);
                    this.getTasks();
                }.bind(this),
                error: function (e) {
                    this.fireEvent("requestLoadTasksEnd", {});
                }.bind(this)
            });

        },

        /**
         * Delete a task
         * Triggered by a button in the front end
         * @param {uuid} taskId - The id of the task we want to delete
         * @param {string} taskName - The name of this task (only used in the confirmation pop up)
         */
        deleteTask : function(taskId, taskName){

            // Creating a confirmation popup before deleting a task
            var msg = "Press OK to delete the task \""+ taskName + "\". \n This action is irreversible.";
            MessageBox.confirm(msg, {
                title: "Warning",
                icon: MessageBox.Icon.WARNING, 
                onClose: function(sAction) {
                    if(sAction == MessageBox.Action.OK){
                        // Calling the real code to delete a task
                        this.deleteTaskRequest(taskId);
                    }
                }.bind(this)
            });

        },

        /**
         * Delete a task (DELETE request)
         * Called by the function deleteTask(...)
         * @param {uuid} idTask - The id of the task we want to delete
         */
        deleteTaskRequest : function(idTask) {
            var oModel = this.component.getModel("task");

            // Configuring the request url with the appropriate destination
            var url = this.getBaseUrl() + "/calm-tasks/v1/tasks/" + idTask;
            
            this.fireEvent("requestLoadTasksStart", {});

            // Sending request
            $.ajax({
                url: url,
                type: 'DELETE',
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function () {
                    oModel.refresh(true);
                    this.getTasks();
                }.bind(this),
                error: function (e) {
                    this.fireEvent("requestLoadTasksEnd", {});
                }
            });

        },

        /**
         * Create a new task (POST request)
         * @param {string} titleTask - The title of the new task
         * @param {date} dateTask - A due date for this task
         * @param {int} priorityTask - The priority of the task
         * @param {string} typeTask - The task type
         * @param {string} descrTask - A short description for the task
         */
        addTask : function(titleTask, dateTask, priorityTask, typeTask, descrTask) {
            var oModel = this.component.getModel("task");

            // Verifying that we are related to a project before adding a related task
            if(this.currentProjectId == null){
                console.log("WARNING !!! No currentProjectId"); 
                return
            }

            // Filling the variable containing all the parameters, it actually is the request body
            var parameter =  {"projectId": this.currentProjectId.toString(), 
                                "title": titleTask, 
                                "dueDate": dateTask,
                                "priorityId": priorityTask, 
                                "type": typeTask,
                                "description": descrTask
                            };

            // Configuring the request url with the appropriate destination
            var url = this.getBaseUrl() + "/calm-tasks/v1/tasks";
            

            this.fireEvent("requestLoadTasksStart", {});
            
            //sending request
            $.ajax({
                url: url,
                type: 'POST',
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(parameter),
                success: function (data) {
                    oModel.refresh(true);
                    this.getTasks();
                }.bind(this),
                error: function (e) {
                    this.fireEvent("requestLoadTasksEnd", {});
                }.bind(this)
            });

        }

    });

});