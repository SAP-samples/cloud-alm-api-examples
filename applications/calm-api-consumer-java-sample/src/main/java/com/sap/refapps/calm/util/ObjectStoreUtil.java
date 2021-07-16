package com.sap.refapps.objectstore.util;

import java.text.DecimalFormat;
import java.util.Date;

import org.jclouds.blobstore.domain.Blob;

import com.sap.refapps.objectstore.model.BlobFile;

public class ObjectStoreUtil {

	private static final String BYTE = "B";
	private static final String KILLOBYTE = "KB";
	private static final String MEGABYTE = "MB";
	private static final String GIGABYTE = "GB";
	private static final String TERABYTE = "TB";
	private static final String DECIMAL_FORMAT_PATTERN = "#,##0.#";
	
	public static final String FILE_ALREADY_EXIST = " already exists in the container.";
	public static final String FILE_DOESNOT_EXIST = " does not exist in the container";
	
	public static final String UPLOAD_SUCCESSFUL = " is successfully uploaded.";
	public static final String DOWNLOAD_SUCCESSFUL = " is successfully downloaded.";
	public static final String DELETE_SUCCESSFUL = " is successfully deleted.";
	
	public static final String UPLOAD_FAILED = "Error occured while uploading the object: ";
	public static final String DOWNLOAD_FAILED = "Error occured while downloading the object: ";
	public static final String DELETE_FAILED = "Error occured while deleting the object: ";
	
	public static final String CANNOT_DELETE_NULL = "Could not delete a null object.";
	public static final String FEATURE_NOT_SUPPORTED_GCP = "The BlobStore list api for GCP is only supported in Jclouds 2.2.0 which is yet to be released.";

	/**
	 * @param size
	 * @return decimalformat of size of file along with unit
	 */
	private static String readableFileSize(final long size) {
		if (size <= 0)
			return "0";
		final String[] units = new String[] { BYTE, KILLOBYTE, MEGABYTE, GIGABYTE, TERABYTE };
		int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
		return new DecimalFormat(DECIMAL_FORMAT_PATTERN).format(size / Math.pow(1024, digitGroups)) + " "
				+ units[digitGroups];
	}

	/**
	 * @param fileName
	 * @return name along with timestamp.
	 */
	public static String generateFileName(final String fileName) {
		return new Date().getTime() + "-" + fileName.replace(" ", "_");
	}

	/**
	 * @param blob
	 * @return blobFile
	 */
	public static BlobFile createBlobFile(final Blob blob) {
		return new BlobFile(
				blob.getMetadata().getETag(), 
				blob.getMetadata().getContainer(), 
				blob.getMetadata().getName(), 
				blob.getMetadata().getUri().toString(),
				readableFileSize(blob.getMetadata().getSize()),
				blob.getMetadata().getLastModified().toString(),
				blob.getPayload().getContentMetadata().getContentType(),
				blob.getMetadata().getUserMetadata()
				);

	}
	
}
