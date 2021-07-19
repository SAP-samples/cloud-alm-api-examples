package com.sap.refapps.cloudalm;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.support.BasicAuthorizationInterceptor;
import org.springframework.web.client.RestTemplate;


public class JWTTokenProvider {
    private final String xsuaaUrl;


    private static final String RETRIEVE_JWT_TOKEN_PATH = "/oauth/token?grant_type=client_credentials&response_type=token";


    private RestTemplate restTemplate;

    @Autowired
    public JWTTokenProvider(RestTemplate restTemplate) {
        VcapServicesDto vcapServicesDto = EnvironmentUtil.getVcapService();
        this.xsuaaUrl = vcapServicesDto.getXsuaaURL();
        this.restTemplate = restTemplate;
        setupRestClient(vcapServicesDto.getClientId(), vcapServicesDto.getClientSecret());
    }

    private void setupRestClient(String uaaClientId, String uaaClientSecret) {
        restTemplate.getInterceptors()
                .add(new BasicAuthorizationInterceptor(uaaClientId, uaaClientSecret));
    }


    public String generateAccessToken() {
        ResponseEntity<JwtTokenDto> jwtTokenResponseEntity = restTemplate
                .getForEntity(xsuaaUrl + RETRIEVE_JWT_TOKEN_PATH, JwtTokenDto.class);

        JwtTokenDto retrievedToken = jwtTokenResponseEntity.getBody();

        return retrievedToken.getAccessToken();
    }
}