package com.sap.refapps.cloudalm;

public class JWTTokenResponse {
    public void setAccess_token(String access_token) {
        this.access_token = access_token;
    }

    public String getAccess_token() {
        return access_token;
    }

    public String access_token;
}
