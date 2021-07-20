package com.sap.refapps.cloudalm;


import com.fasterxml.jackson.annotation.JsonProperty;

public class JwtTokenDto {

    private final String accessToken;

    public JwtTokenDto(@JsonProperty("access_token") String accessToken) {
        this.accessToken = accessToken;
    }

    public String getAccessToken() {
        return accessToken;
    }


}

