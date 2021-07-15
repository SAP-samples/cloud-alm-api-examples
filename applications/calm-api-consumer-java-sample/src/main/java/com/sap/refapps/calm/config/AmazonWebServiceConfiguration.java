package com.sap.refapps.objectstore.config;

import org.jclouds.ContextBuilder;
import org.jclouds.blobstore.BlobStoreContext;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.sap.refapps.objectstore.util.CloudProviders;

/**
 * This is AWS Credentials Configuration class
 *
 */

@Profile("cloud-aws")
@Configuration
@ConfigurationProperties(prefix = "vcap.services.objectstore-service.credentials")
public class AmazonWebServiceConfiguration {
	
	private String accessKeyId;
	private String bucket;
	private String secretAccessKey;
	
	public String getAccessKeyId() {
		return accessKeyId;
	}
	public void setAccessKeyId(final String accessKeyId) {
		this.accessKeyId = accessKeyId;
	}
	public String getBucket() {
		return bucket;
	}
	public void setBucket(final String bucket) {
		this.bucket = bucket;
	}
	public String getSecretAccessKey() {
		return secretAccessKey;
	}
	public void setSecretAccessKey(final String secretAccessKey) {
		this.secretAccessKey = secretAccessKey;
	}

	/**
	 * @return blobStoreContext
	 */
	public BlobStoreContext getBlobStoreContext() {
		return ContextBuilder.newBuilder(CloudProviders.PROVIDER_AWS.toString())
				.credentials(this.getAccessKeyId(), this.getSecretAccessKey())
				.buildView(BlobStoreContext.class);
	}
	
}