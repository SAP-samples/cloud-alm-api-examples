package com.sap.refapps.objectstore.util;

import java.io.IOException;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class EnvironmentUtil {
	
	private static final Logger logger = LoggerFactory.getLogger(EnvironmentUtil.class);
	
	private static String activeProfile;
	
	private static final String VCAP_SERVICE = "VCAP_SERVICES";
	private static final String OBJECTSTORE = "objectstore";
	private static final String PLAN = "plan";
	
	/**
	 * This method is used to return the profile name to
	 * activate based on service plans.
	 * 
	 * @return profile name
	 */
	public static String getActiveProfile(){
		final String servicePlan = getServicePlan();
		if(servicePlan.equals(CloudProviders.PlAN_AWS.toString())) {
			activeProfile = CloudProviders.PROFILE_AWS.toString();
		} 

		
		return activeProfile;
	}
	
	/**
	 * This method is used to parse the service plan name from VCAP_SERVICES
	 * 
	 * @return service plan name
	 */
	private static String getServicePlan(){
		Optional<String> servicePlan = Optional.empty();
		final String jsonString = System.getenv(VCAP_SERVICE);
		if(jsonString != null){
			try {
				ObjectMapper mapper = new ObjectMapper();
				JsonNode root = mapper.readTree(jsonString);
				JsonNode objectstoreNode = root.path(OBJECTSTORE);
				
				for (JsonNode node : objectstoreNode) {
					servicePlan = Optional.of(node.path(PLAN).asText());
				}
				
			} catch (IOException e) {
				logger.error("Exception occurred: " + e);
			}
		}
		return servicePlan.get();
	}

}
