package com.sap.refapps.cloudalm;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.client.RestTemplate;

@RestController
public class CloudALMAPIAccessController {

    @Autowired
    private Environment env;
    @Value("${sap.cloudalm.public.api.url.eu10}")
    private String cloudAlmApiUrl;
    @RequestMapping("/cloud-alm/projects")
    public String getCloudALMProjects(RestTemplate restTemplate) throws JsonProcessingException {
        JWTTokenProvider jwtTokenProvider = new JWTTokenProvider(restTemplate);
        String accessToken = jwtTokenProvider.generateAccessToken();

        if (accessToken != null) {
            System.out.println("Request Successful");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer "+accessToken);

            HttpEntity<String> requestEntity = new HttpEntity<String>(null,headers);
            ResponseEntity<ProjectDto[]> responseEntity = restTemplate.exchange(cloudAlmApiUrl, HttpMethod.GET, requestEntity, ProjectDto[].class);
            ObjectMapper mapper = new ObjectMapper();
            String jsonString = mapper.writeValueAsString(responseEntity);
            System.out.println(jsonString);
            return jsonString;
        } else {
            System.out.println("Request Failed");
        }
        return "Sorry could not fetch Access Token!";
    }
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder.build();
    }

}
