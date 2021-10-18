sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Controller, Filter, FilterOperator) {
    "use strict";
    return Controller.extend("sap.ui.demo.cloudalmapi.controller.PieChart", {

        onInit: function () {
            this.mModelManager = this.getOwnerComponent().getModelManager();
            // register event 
            this.mModelManager.attachRequestLoadTasksStart(this.enableBusyIndicator.bind(this)); 
            this.mModelManager.attachRequestLoadTasksEnd(this.disableBusyIndicator.bind(this));
        }, 

        enableBusyIndicator : function() {
            this.byId("idVizFrame").setBusy(true); 
        }, 

        disableBusyIndicator : function() {
            this.byId("idVizFrame").setBusy(false); 
        }
    })
})