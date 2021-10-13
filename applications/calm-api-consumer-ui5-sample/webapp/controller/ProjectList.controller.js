sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
	"use strict";
	return Controller.extend("sap.ui.demo.cloudalmapi.controller.ProjectList", {

        onInit : function(){
            var oTable = this.byId("projectList");
            this.mModelManager = this.getOwnerComponent().getModelManager();

            // Hide the ugly selector, now the user can select by clicking anywhere on the row
            oTable.setSelectionBehavior("RowOnly"); 

            // Register to the events
            this.mModelManager.attachRequestLoadProjectsStart(this.enableBusyIndicator.bind(this)); 
            this.mModelManager.attachRequestLoadProjectsEnd(this.disableBusyIndicator.bind(this));
        },

        enableBusyIndicator : function() {
            this.byId("tablehbox").setBusy(true); 
        }, 

        disableBusyIndicator : function() {
            this.byId("tablehbox").setBusy(false); 
        }, 

        /**
         * Filter the projects from the search bar
         * Called everytime a letter is typed or deleted in the search bar 
         * @param {Event} oEvent - Change of the content of the search bar
         */
		onFilterProjects : function (oEvent) {

			// Build a filter array
            var aFilter = [];
            
            // Add the needed filter
            var sQuery = this.getView().byId("input").getValue();
			if (sQuery) {
				aFilter.push(new Filter("name", FilterOperator.Contains, sQuery));
			}

			// Bind the filter to the rows of the table
			var oList = this.byId("projectList");
			var oBinding = oList.getBinding("rows");
			oBinding.filter(aFilter);
        },
        
        /**
         * Load the Task model and dispay the tasks in the Kanban and the Pie Chart
         * Called everytime the user selects or unselects a row in the Project List Table
         * @param {Event} oEvent - Project selection
         */
        showTasks : function(oEvent) {
            if(this.byId("projectList").getSelectedIndices().length != 0){
                this.mModelManager.getTasks( oEvent.getParameter("rowContext").getObject().id);
            } else {
                // No project selected so no tasks to show
                this.mModelManager.flushTasks();
            }
        },
        
        /**
         * Reload all the projects
         * Triggered by a button at the top right corner of the table
         */
        onRefreshProjects : function() {
            this.mModelManager.getProjects(); 
            this.mModelManager.flushTasks();
        }
	});
});