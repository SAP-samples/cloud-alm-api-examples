package com.sap.refapps.cloudalm;


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
    private static final String SAPCLOUDALMAPIs = "SAPCloudALMAPIs";
    private static final String UAA = "uaa";
    private static final String URL = "url";
    private static final String CLIENT_ID = "clientid";
    private static final String CLIENT_SECRET = "clientsecret";
    private static final String CREDENTIALS = "credentials";



    /**
     * This method is used to parse the service plan name from VCAP_SERVICES
     *
     * @return service plan name
     */
    public static VcapServicesDto getVcapService() {
        Optional<String> xsuaaUrl = Optional.empty();
        Optional<String> clientID = Optional.empty();
        Optional<String> clientSecret = Optional.empty();
        VcapServicesDto vcapServicesDto = new VcapServicesDto();

        final String jsonString = System.getenv(VCAP_SERVICE);
        if (jsonString != null) {
            System.out.println(jsonString);
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(jsonString);
                JsonNode credentialsNode = root.path(SAPCLOUDALMAPIs).path(0).path(CREDENTIALS);


                xsuaaUrl = Optional.of(credentialsNode.path(UAA).path(URL).asText());
                vcapServicesDto.setXsuaaURL(xsuaaUrl.get());
                clientID = Optional.of(credentialsNode.path(UAA).path(CLIENT_ID).asText());
                vcapServicesDto.setClientId(clientID.get());
                clientSecret = Optional.of(credentialsNode.path(UAA).path(CLIENT_SECRET).asText());
                vcapServicesDto.setClientSecret(clientSecret.get());


            } catch (IOException e) {
                logger.error("Exception occurred: " + e);
            }
        }
        return vcapServicesDto;
    }


}
