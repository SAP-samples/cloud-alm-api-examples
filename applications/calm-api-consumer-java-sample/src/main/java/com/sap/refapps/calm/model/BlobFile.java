package com.sap.refapps.objectstore.model;

import java.util.Map;

/**
 * Model class to store the properties of a BLOB file.
 *
 */
public class BlobFile {
	
    private String etag;
    private String bucket;
    private String name;
    private String url;
    private String lastModified;
    private String size;
    private String contentType;
    
    private Map<String,String> userMetadata;

	public BlobFile() {
    }

    public BlobFile(final String name){
    	this.name = name;
    }
    
    public BlobFile(final String etag, final String name, final String url, final String lastModified, final String size, final String contenType){
    	 this.etag = etag;
         this.name = name;
         this.url = url;
         this.size = size;
         this.lastModified = lastModified;
         this.contentType = contenType;
    }
    
	public BlobFile(final String etag, final String bucket, final String name, final String url, final String size, final String lastModified,
			final String contenType, final Map<String, String> userMetadata) {
        this.etag = etag;
        this.bucket = bucket;
        this.name = name;
        this.url = url;
        this.size = size;
        this.lastModified = lastModified;
        this.contentType = contenType;
        this.userMetadata = userMetadata;
    }
    
    public Map<String, String> getUserMetadata() {
		return userMetadata;
	}
    
    public String getContentType(){
    	return contentType;
    }
       
    public String getLastModified() {
		return lastModified;
	}

	public String getSize() {
		return size;
	}

	public String getEtag() {
        return etag;
    }

    public String getBucket() {
        return bucket;
    }

    public String getName() {
        return name;
    }
    
    public String getUrl()  {
        return url;
    }

}
