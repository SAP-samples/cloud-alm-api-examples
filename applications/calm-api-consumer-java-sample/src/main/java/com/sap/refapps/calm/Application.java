package com.sap.refapps.objectstore;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

import com.sap.refapps.objectstore.config.ObjectStoreContextInitializer;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		new SpringApplicationBuilder(Application.class)
		.initializers(new ObjectStoreContextInitializer()).run(args);
	}

}

