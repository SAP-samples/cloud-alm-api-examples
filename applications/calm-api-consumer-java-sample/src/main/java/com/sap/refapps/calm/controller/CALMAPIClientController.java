package com.sap.refapps.objectstore.controller;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.google.common.io.ByteStreams;
import com.sap.refapps.objectstore.model.BlobFile;
import com.sap.refapps.objectstore.service.ObjectStoreService;
import com.sap.refapps.objectstore.util.ObjectStoreUtil;

@RestController
@RequestMapping("/objectstorage.svc/api/v1")
public class ObjectstoreController {

	private ObjectStoreService objectStoreService;
	private static Logger logger = LoggerFactory.getLogger(ObjectstoreController.class);

	@Autowired
	public ObjectstoreController(final ObjectStoreService objectStoreService) {
		this.objectStoreService = objectStoreService;
	}

	/**
	 * @return list of blobfiles
	 * Function to get the list of objects in the objectStore.
	 */
	@GetMapping("/storage")
	@ResponseBody
	public ResponseEntity<List<BlobFile>> listFiles() {

		List<BlobFile> blobFiles = this.objectStoreService.listObjects();
		return new ResponseEntity<>(blobFiles, HttpStatus.OK);
	}

	/**
	 * @param request
	 * @return Message indicating if the file has been uploaded
	 * Function to upload objects to objectStore.
	 */
	@PostMapping("/storage")
	public ResponseEntity<String> uploadFile(HttpServletRequest request) throws IOException, FileUploadException {

		byte[] byteArray = null;
		String message = "";
		Optional<FileItemStream> fileItemStream = Optional.empty();
		
		boolean isMultipart = ServletFileUpload.isMultipartContent(request);
		
		if(isMultipart) {
			ServletFileUpload upload = new ServletFileUpload();
			FileItemIterator fileItemIterator = upload.getItemIterator(request);
			
			while(fileItemIterator.hasNext()) {
				fileItemStream = Optional.of(fileItemIterator.next());
				InputStream inputStream = fileItemStream.get().openStream();
				byteArray = ByteStreams.toByteArray(inputStream);
				if(!fileItemStream.get().isFormField()) {
					final String contentType = fileItemStream.get().getContentType();
					message = objectStoreService.uploadFile(byteArray, fileItemStream.get().getName(), contentType);
				}
			}
		}
		return new ResponseEntity<>(message, HttpStatus.ACCEPTED);
	}

	/**
	 * @param fileName
	 * @return inputStream containing the file
	 * Function to get a particular objects from objectStore.
	 */
	@GetMapping(value = "/storage/{name:.*}")
	public ResponseEntity<InputStreamResource> getFile(@PathVariable(value = "name") String fileName) {

		if (fileName != null) {
			HttpHeaders respHeaders = new HttpHeaders();

			if (this.objectStoreService.isBlobExist(fileName)) {
				respHeaders.setContentDispositionFormData("attachment", fileName);
				InputStreamResource inputStreamResource = new InputStreamResource(this.objectStoreService.getFile(fileName));
				return new ResponseEntity<InputStreamResource>(inputStreamResource, respHeaders, HttpStatus.OK);
			} else {
				return errorMessage(fileName + ObjectStoreUtil.FILE_DOESNOT_EXIST, HttpStatus.NOT_FOUND);
			}
		}

		// Default to 200, when input is missing
		return new ResponseEntity<InputStreamResource>(HttpStatus.OK);
	}

	/**
	 * @param fileName
	 * @return Message indicating if the file has been deleted
	 * Function to delete an object
	 */
	@DeleteMapping("/storage/{name}")
	public ResponseEntity<String> deleteFile(@PathVariable(value = "name") String fileName) {
		String msg = ObjectStoreUtil.CANNOT_DELETE_NULL;
		if (fileName != null) {
			if (this.objectStoreService.isBlobExist(fileName)) {
				if (this.objectStoreService.deleteFile(fileName)) {
					msg = fileName + ObjectStoreUtil.DELETE_SUCCESSFUL;
				} else {
					msg = ObjectStoreUtil.DELETE_FAILED + fileName;
					return new ResponseEntity<>(msg, HttpStatus.INTERNAL_SERVER_ERROR);
				}
			} else {
				msg = fileName + ObjectStoreUtil.FILE_DOESNOT_EXIST;
				return errorMessage(msg, HttpStatus.NOT_FOUND);
			}

		}

		return new ResponseEntity<>(msg, HttpStatus.OK);
	}

	/**
	 * @param message
	 * @param status
	 * @return ResponseEntity with HTTP status,headers and body
	 * helper function to form the responseEntity
	 */
	private static ResponseEntity errorMessage(String message, HttpStatus status) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(org.springframework.http.MediaType.TEXT_PLAIN);

		return ResponseEntity.status(status).headers(headers).body(message);
	}
	
}
