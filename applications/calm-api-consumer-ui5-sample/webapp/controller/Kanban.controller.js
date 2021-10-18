sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "../utils/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
	
], function(Controller, Fragment, Filter, FilterOperator, JSONModel, formatter, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("sap.ui.demo.cloudalmapi.controller.Kanban", {
        formatter : formatter,
        onInit: function () {
            // Load ModelManager's call in local variable
            this.mModelManager = this.getOwnerComponent().getModelManager();

            // Register to the event 
            this.mModelManager.attachRequestLoadTasksStart(this.enableBusyIndicator.bind(this)); 
            this.mModelManager.attachRequestLoadTasksEnd(this.disableBusyIndicator.bind(this));
            ///////
            this.mModelManager.attachRequestLoadInfoTaskStart(this.enableEditBusyIndicator.bind(this));
            this.mModelManager.attachRequestLoadInfoTaskEnd(this.disableEditBusyIndicator.bind(this)); 
            ///////
            this.mModelManager.attachCurrentProjectIdChange(this.setVisibleButtons.bind(this));

            // Calculate the number of tasks for each column of the kanban
            this.CountTasks("tableOpen", "cptOpen");
            this.CountTasks("tableBlocked", "cptBlocked");
            this.CountTasks("tableInProgress", "cptInProgress");
            this.CountTasks("tableDone", "cptDone");
        }, 

        /**
         * Method to count the tasks in a table of the kanban
         * @param {uuid} idTable : id of the table from wich we want to count the tasks.
         * @param {*} idText : id of the text field to update to indicate the number of tasks in the kanban.
         */
        CountTasks : function(idTable, idText) {
            var oTable = this.byId(idTable);          // Get the table whose tasks we want to count 
            var oRowsBinding = oTable.getBinding("items");
            var openTextField = this.byId(idText); 
            oRowsBinding.attachChange(function(){
                var oLength = oRowsBinding.getLength();          //Gets you the rows length
                openTextField.setText(oLength);
            })
            
        }, 


        /**
         * Enable or disable the header buttons of the kanban if no project is selected.
         * @param {Event} oEvent - thrown by the ModelManager when a project is selected or not.
         *                         Contains a boolean projectSelected to indicate if a project is selected.
         */
        setVisibleButtons : function(oEvent) {
            var visibleResult = oEvent.getParameter("projectSelected");
            this.byId("btnAddTask").setEnabled(visibleResult);
            this.byId("idComboBox").setEnabled(visibleResult);
        }, 

        /**
         * Enable a busy indicator on all tables
         */
        enableBusyIndicator : function() {
            this.byId("allTables").setBusy(true); 
        }, 

        /**
         * Disable a busy indicator on all tables
         */
        disableBusyIndicator : function() {
            this.byId("allTables").setBusy(false); 
        }, 

        /**
         * Enable a busy indicator for the editTask dialog
         */
        enableEditBusyIndicator: function(){
            this.byId("createTask").setBusy(true);
        },

        /**
         * Disable a busy indicator for the editTask dialog
         */
        disableEditBusyIndicator: function(){
            this.byId("createTask").setBusy(false); 
        }, 

        /**
         * Filter the Tasks from the search bar
         * Called everytime a letter is typed or deleted in the search bar 
         * @param {Event} oEvent - Change of the content of the search bar
         */
        onFilterTasks : function(oEvent) {

            // Build a filter array
            var aFilter = [];

            // Add the needed filter
            var sQuery = this.byId("input").getValue();
            if (sQuery) {
                aFilter.push(new Filter("title", FilterOperator.Contains, sQuery));
            }

			// Bind the filter to all 4 tables
            this.applyFilter(aFilter, "tableOpen");
            this.applyFilter(aFilter, "tableBlocked");
            this.applyFilter(aFilter, "tableInProgress");
            this.applyFilter(aFilter, "tableDone");
        },

        /**
         * 
         * @param {Filter[]} filterParam - The table that contains the filters we want to apply
         * @param {uuid} idTable - the id on the table we want to apply the filter on
         */
        applyFilter : function(filterParam, idTable){
            var oList = this.byId(idTable);
            var oBinding = oList.getBinding("items");
            oBinding.filter(filterParam);
        },

        /**
         * Used to verify if the user doesn't try to drag and drop the task on the very same table
         * @param {string} currentStatus - Actual status of a task
         * @param {string} newStatus - Potential new status of this same task
         */
        verifyOrigin(currentStatus, newStatus) {
            currentStatus = currentStatus.substring(5);
            return currentStatus.toString() === newStatus; 
        },

        /**
         * Change the status of the task when it is dropped in a new table
         * @param {Event} oEvent - When the task is dropped in a table
         * @param {string} newStatus - The new status of the involved task
         */
        performeDropTask : function(oEvent, newStatus) {
            var oDraggedItem = oEvent.getParameter("draggedControl");
            var oDraggedItemContext = oDraggedItem.getBindingContext("kanbanModel").getObject();
            
            // Do some verifications on where the task is dropped
            if(!oDraggedItemContext || this.verifyOrigin(oDraggedItemContext.status, newStatus)) {
                return;
            }
            var idTask = oDraggedItemContext.id;

            newStatus = oDraggedItemContext.status.substring(0, 5).concat(newStatus);

            this.mModelManager.changeStatusTask(idTask, newStatus); 
        }, 

        /**
         * Refresh the task model
         * Triggered by a button in the ui
         */
        onRefreshTasks : function() {
            this.mModelManager.getTasks(); 
        }, 

        
        /**
         * Create a model for the opened dialog. This model contain the information for the two drop down 
         * in the dialog, the drop down of priority and the drop down of the type of priority. 
         * @param {boolean} performeAnEdit : boolean to indicate if the dialog is to perform
         *                                   an edit (true) or an add (false) of a task.
         */
        createPriorityModel : function(performeAnEdit){
            var oData = {
                "CreateOrEdit" : (performeAnEdit ? "Edit" : " Create"), 
                "SubmitOrUpdate" : (performeAnEdit ? "Update" : "Submit"), 
                "DeafaultNumberPrio": 30,
                "PriorityCollection": [
                    {
                        "NumberPrio": 10,
                        "PrioText": "Very High"
                    },
                    {
                        "NumberPrio": 20,
                        "PrioText": "High"
                    },
                    {
                        "NumberPrio": 30,
                        "PrioText": "Medium"
                    },
                    {
                        "NumberPrio": 40,
                        "PrioText": "Low"
                    }
                ],
                "DeafaultTaskType": "CALMTASK",
                "TypeCollection": [
                    {
                        "TaskType": "CALMTASK",
                        "TypeText": "Project Task"
                    },
                    {
                        "TaskType": "CALMUS",
                        "TypeText": "User Story"
                    }
                ]
            }; 
            // set explored app's mo model on this sample
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);
        },

        /**
         * Method to open the dialog with the fragment view CreateTask.fragment.xml 
         * to add or edit a task.
         * @param {*} taskInformation : in case of an edit of the task, 
         * we pass the information of this task through the parameters.
         */
        onOpenDialog : function (taskInformation) {


            // calculate the boolean to determine if we perform an edit of the task or not.
            var performeAnEdit = (taskInformation ? true : false);
            if(performeAnEdit){
                // if we perform an edit, then we save the id of the task in a local variable.
                this.saveIdTask = taskInformation.id;
            }

            // creation of the priority model
            this.createPriorityModel(performeAnEdit);

			// create dialog lazily
			if (!this.pDialog) {
				this.pDialog = Fragment.load({
					id: this.getView().getId(),
                    name: "sap.ui.demo.cloudalmapi.view.CreateTask",
                    controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
                    this.getView().addDependent(oDialog);
					return oDialog;
				}.bind(this));
			} 
			this.pDialog.then(function(oDialog) {
                oDialog.open();

                if(performeAnEdit){
                    // in case of an editTask we hide some unused fields and fill the others fields with 
                    // the information of the task to edit. 

                    console.log("Begin get info");
                    this.mModelManager.getInfoTask(taskInformation.id); 
                    this.mModelManager.attachRequestLoadInfoTaskError(            
                        function(){this.onCloseDialog();}.bind(this)
                    );     

                    console.log("End get info"); 

                    this.byId("typeVBox").setVisible(false);
                    this.getView().getModel().setProperty("/DeafaultNumberPrio", taskInformation.priorityId); 
                    this.byId("submitBtn").setEnabled(true);
                } else {
                    // in case of an addTask we make sure that 
                    // the minimum entry date is today's date.
                    this.byId("inputDate").setMinDate(new Date());
                }
            }.bind(this));
            
            
        }, 

        /**
         * Close the dialog and flush it:
         */
        onCloseDialog : function() {
            // Flush the input of the dialog
            console.log("onCloseDialog is called"); 
            this.byId("inputTitle").setValue("");
            this.byId("inputDescr").setValue("");
            this.byId("inputDate").setValue("");

            // If we updated a task
            if(this.saveIdTask){

                // Display the type VBox field for the add task
                this.byId("typeVBox").setVisible(true);

                // Disable the submit / update button
                this.byId("submitBtn").setEnabled(false);

                // clean the id of task save (When update task)
                this.saveIdTask = null; 
            } else {
                this.byId("inputDate").setMinDate(null);
            }

            // close the dialog
            this.byId("createTask").close();
        }, 

        /**
         * check if the title field is empty or not and enable the bouton to submit the new task.
         * This function is call in the CreateTask.fragment.xml in the liveChange field of the input title. 
         */
        checkTitle : function(oEvent) {
            var sText = oEvent.getParameter("value");
            this.byId("submitBtn").setEnabled((sText.length > 0));
        }, 

        /**
         * Verify if the date in the date field is in the good format.
         * This method is called by the CreateTask.fragment.xml view in the "change" 
         * field of the "DatePicker" and in this controller in the method "onSubmitTask".
         */
        dateIsValid: function() {

            var sValue = this.byId("inputDate").getValue();
            var sValid = this.byId("inputDate").isValidValue();

            if (sValue != ''){
                this.byId("inputDate").setValueState(sValid ? "Success" : "Error"); 
            } else {
                this.byId("inputDate").setValueState("None"); 
            }

            return sValid;
        },

        /**
         * Method to create or edit a task 
         * Remarque : some fields between the editTask and addTask are différents.
         */
        onSubmitTask : function(){

            // before execute the method we verify that the date field is valid.
            if (!this.dateIsValid()){
                return ; 
            }

            // We get the content of each field present in the opened dialog.
            var sTitleValue = this.byId("inputTitle").getValue();
            var sDescriptionValue = this.byId("inputDescr").getValue(); 
            var sDateValue = this.byId("inputDate").getValue();
            var sPriorityValue = this.byId("inputPriority").getSelectedKey();
            var sTypeValue = this.byId("inputType").getSelectedKey();

        
            if(this.saveIdTask){
                // if the saveIdTask variable is filled, then we must performe an editTask
                this.mModelManager.editTask(this.saveIdTask, sTitleValue, sDateValue, sPriorityValue, sDescriptionValue);
                
            } else {
                // otherwise it's an addTask
                this.mModelManager.addTask(sTitleValue, sDateValue, sPriorityValue, sTypeValue, sDescriptionValue); 
            }
            // to finish we close the dialog
            this.onCloseDialog();
        },

        /**
         * Delete a task (with verification first)
         * Triggered by a button in the ui
         * @param {uuid} taskId - The id of the task we want to delete
         * @param {string} taskName - The name of this task
         */
        onDeletePress: function(taskId, taskName){
            this.mModelManager.deleteTask(taskId, taskName);
        },
        
        /**
         * Filter the tasks in the 4 tables by priority (only one at the time of all of them)
         * @param {Event} oEvent - An item is chosen in the priority dropdown
         */
        filterByPriority : function(oEvent) {

            // Build a filter array
            var aFilter = [];

            // Add the needed filter
            var sQuery = this.byId("idComboBox").getSelectedKey();
            var priorityId = formatter.priorityTextToId(sQuery);
            if (sQuery && priorityId != 0) { 
                // Here in the if statement we added "priorityId != 0" 
                // because if it equals zero then it means you have to show all priorities so no filter needed
                aFilter.push(new Filter("priorityId", FilterOperator.EQ, priorityId));
            }

			// Bind the filter to all 4 tables
            this.applyFilter(aFilter, "tableOpen");
            this.applyFilter(aFilter, "tableBlocked");
            this.applyFilter(aFilter, "tableInProgress");
            this.applyFilter(aFilter, "tableDone");
        }
    })

})