sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/demo/cloudalmapi/ModelManager", 
    "./utils/Constants"
], function (UIComponent, ModelManager, Constants) {
    "use strict";


	return UIComponent.extend("sap.ui.demo.cloudalmapi.Component", {
        
		init : function () {
			// call the init function of the parent
            UIComponent.prototype.init.apply(this, arguments);
            this.modelManager = new ModelManager(this);
            this.modelManager.init();

            // set constants model
            var oConstantsModel = new sap.ui.model.json.JSONModel();
            oConstantsModel.setData(Constants);
            this.setModel(oConstantsModel,"constants");
        },

        getModelManager : function() {
            return this.modelManager;
        }


	});

});