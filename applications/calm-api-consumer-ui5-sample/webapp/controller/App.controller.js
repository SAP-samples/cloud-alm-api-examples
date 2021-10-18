sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("sap.ui.demo.cloudalmapi.controller.App", {
        
        onInit : function() {
            this.getView().byId("grid").setSnapToRow(true);
            this.mModelManager = this.getOwnerComponent().getModelManager();

        },
         
        /**
         * Set the destination in the ModelManager
         * Load and display the projects
         * @param {Event} oEvent - Selection of an item from the "Select a Destination" dropdown
         */
        onRESTCall: function(oEvent){
            var destination = oEvent.getParameter("item").getKey();
            this.mModelManager.setDestination(destination);
            this.mModelManager.attachRequestLoadProjectsEnd(            
                function(){this.getView().byId("menuBTN").setText("Connected: " + destination);}.bind(this)
            );
            this.mModelManager.attachRequestLoadProjectsError(            
                function(){this.getView().byId("menuBTN").setText("Select a destination");}.bind(this)
            );
            this.mModelManager.getProjects();

        }
	});

});