package com.sap.refapps.objectstore.repository;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.jclouds.blobstore.BlobStore;
import org.jclouds.blobstore.BlobStoreContext;
import org.jclouds.blobstore.domain.Blob;
import org.jclouds.blobstore.domain.PageSet;
import org.jclouds.blobstore.domain.StorageMetadata;
import org.jclouds.io.Payload;
import org.jclouds.io.payloads.ByteArrayPayload;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Repository;

import com.sap.refapps.objectstore.model.BlobFile;
import com.sap.refapps.objectstore.util.ObjectStoreUtil;

@Repository
public class ObjectStoreRepository {

	private BlobStoreContext context;
	private BlobStore blobStore;

	private static Logger logger = LoggerFactory.getLogger(ObjectStoreRepository.class);

	public BlobStoreContext getContext() {
		return context;
	}

	public void setContext(BlobStoreContext context) {
		this.context = context;
	}

	/**
	 * @param bucketName
	 * @param data
	 * @param fileName
	 * @return message
	 */
	public String uploadFile(String bucketName, byte[] bytes, String fileName, String contentType) {

		String message = null;

		try {
			// getting blob store
			blobStore = getContext().getBlobStore();
			
			// creating payload
			Payload payload = new ByteArrayPayload(bytes);

			// adding user metadata to the blob
			Map<String, String> userMetadata = new HashMap<String, String>();
			userMetadata.put("description", "sample content");

			// creating Blob
			Blob blob = blobStore.blobBuilder(fileName)
								.payload(payload)
								.contentType(contentType)
								.userMetadata(userMetadata)
								.build();

			// multipart issue: (https://issues.apache.org/jira/browse/JCLOUDS-1064).
			blobStore.putBlob(bucketName, blob);
			message = fileName + ObjectStoreUtil.UPLOAD_SUCCESSFUL;
		
		} finally {
			getContext().close();
		}
		
		return message;
	}

	/**
	 * @param bucketName
	 * @return List<BlobFile>
	 */
	public List<BlobFile> listFiles(String bucketName) {
		
		List<BlobFile> files = new ArrayList<>();
		PageSet<? extends StorageMetadata> list;

		try {
			//getting blobstore
			blobStore = getContext().getBlobStore();
			
			//List all files from the bucket 
			list = blobStore.list(bucketName);

			if(list != null) {
				// Iterate and form the list to be returned
				for (Iterator<? extends StorageMetadata> it = list.iterator(); it.hasNext(); ) {
					StorageMetadata storageMetadata = it.next();
					Blob blob = blobStore.getBlob(bucketName, storageMetadata.getName());
					files.add(ObjectStoreUtil.createBlobFile(blob));
				}
			}
		} finally {
			getContext().close();
		}
		return files;
	}

	/**
	 * @param bucketName
	 * @param fileName
	 * @return InputStream
	 */
	public InputStream downloadFile(String bucketName, String fileName) {
		
		InputStream inputStream = null;
		try {
			//getting blobstore
			blobStore = getContext().getBlobStore();
			
			// getting blob
			Blob blob = blobStore.getBlob(bucketName, fileName);
			
			inputStream = blob.getPayload().openStream();
			logger.info(fileName + ObjectStoreUtil.DOWNLOAD_SUCCESSFUL);
			
		} catch(IOException e) {
			logger.error(ObjectStoreUtil.DOWNLOAD_FAILED + fileName + e);
			
		} finally {
			getContext().close();
		}
		
		return inputStream;
	}

	/**
	 * @param bucketName
	 * @param fileName
	 * @return true/false if the blobfile has been deleted
	 */
	public boolean deleteFile(String bucketName, String fileName) {

		boolean isBlobRemoved = false;
		try {
			//getting blobstore
			blobStore = getContext().getBlobStore();
			//removing blob
			blobStore.removeBlob(bucketName,fileName);
			
			if(!isBlobExist(bucketName, fileName)) {
				isBlobRemoved = true;
				logger.info(fileName + ObjectStoreUtil.DELETE_SUCCESSFUL);
			}
		} finally {
			getContext().close();
		}
		
		return isBlobRemoved;
	}

	public boolean isBlobExist(String bucketName,String fileName) {
		
		boolean isExist = false;
		try {
			//getting blobstore
			blobStore = getContext().getBlobStore();
			isExist = blobStore.blobExists(bucketName, fileName);
		} finally {
			getContext().close();
		}
		return isExist;
	}
	
}
