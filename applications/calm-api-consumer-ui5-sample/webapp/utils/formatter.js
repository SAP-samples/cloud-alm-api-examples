sap.ui.define([], function () {
	"use strict";
	return {
		priorityTextToId: function (priority) {
			switch (priority) {
				case "VeryHigh":
					return 10;
				case "High":
					return 20;
				case "Medium":
                    return 30;
                case "Low":
					return 40;
				default:
					return 0;
			}
        },
        
        priorityColorScheme: function(priorityId){
			switch (priorityId) {
				case 10:
					return "darkred";
				case 20:
					return "red";
				case 30:
					return "orange";
				default:
					return "green";
			}
        },

        priorityIcon: function(priorityId){
            switch (priorityId) {
				case 10:
					return "sap-icon://collapse-group";
				case 20:
					return "sap-icon://navigation-up-arrow";
				case 30:
					return "sap-icon://less";
				default:
					return "sap-icon://navigation-down-arrow";
			}
        }
	};
});