# Contributing to API examples for SAP Cloud ALM

You want to contribute to our API examples? Welcome! Please read this document to understand what you can do:

## Contribute Code

You are welcome to contribute code to this repository in order to fhelp others using the APIs.

There are three important things to know:

1.  You must be aware of the Apache License (which describes contributions) and **agree to the Developer Certificate of Origin**. This is common practice in all major Open Source projects. To make this process as simple as possible, we are using *[CLA assistant](https://cla-assistant.io/)*. CLA assistant is an open source tool that integrates with GitHub very well and enables a one-click-experience for accepting the DCO. See the respective section below for details.
2.  **Not all proposed contributions can be accepted**. Some features may e.g. just fit a third-party add-on better. The code must fit the overall direction of OpenUI5 and really improve it, so there should be some "bang for the byte". For most bug fixes this is a given, but major feature implementation first need to be discussed with one of the OpenUI5 committers (the top 20 or more of the [Contributors List](https://github.com/SAP/openui5/graphs/contributors)), possibly one who touched the related code recently. The more effort you invest, the better you should clarify in advance whether the contribution fits: the best way would be to just open an enhancement ticket in the issue tracker to discuss the feature you plan to implement (make it clear you intend to contribute). We will then forward the proposal to the respective code owner, this avoids disappointment.


### Developer Certificate of Origin (DCO)

Due to legal reasons, contributors will be asked to accept a DCO before they submit the first pull request to this project. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).  
This happens in an automated fashion during the submission process: the CLA assistant tool will add a comment to the pull request. Click it to check the DCO, then accept it on the following screen. CLA assistant will save this decision for upcoming contributions.

This DCO replaces the previously used CLA ("Contributor License Agreement") as well as the "Corporate Contributor License Agreement" with new terms which are well-known standards and hence easier to approve by legal departments. Contributors who had already accepted the CLA in the past may be asked once to accept the new DCO.


### Contribution Content Guidelines

Contributed content can be accepted if itthey are usefull for other and help to  improve the API examples.
In addition there are a few more rules that we would like you to follow:

-   Apply a clean coding style adapted to the surrounding code, even though we are aware the existing code is not fully clean
-   Use tabs for indentation (except if the modified file consistently uses spaces)
-   Only access public APIs of other entities 
-   Comment your code where it gets non-trivial and remember to keep the public JSDoc documentation up-to-date
-   Keep an eye on performance and memory consumption, properly destroy objects when not used anymore (e.g. avoid ancestor selectors in CSS)
-   Try to write slim and "modern" HTML and CSS, avoid using images and affecting any non-UI5 content in the page/app
-   Always consider the developer who USES your control/code!
    -   Think about what code and how much code he/she will need to write to use your feature
    -   Think about what she/he expects your control/feature to do


### How to contribute - the Process

1.  Make sure the change would be welcome (e.g. a bugfix or a useful feature); best do so by proposing it in a GitHub issue
2.  Create a branch forking the examples repository and do your change
3.  Commit and push your changes on that branch
    -   When you have several commits, squash them into one (see [this explanation](http://davidwalsh.name/squash-commits-git)) - this also needs to be done when additional changes are required after the code review
4.  Create a Pull Request to github.com/SAP-samaples/cloud-alm-api-examples
5.  Follow the link posted by the CLA assistant to your pull request and accept the Developer Certificate of Origin, as described in detail above.
6.  Wait for our code review and approval, possibly enhancing your change on request
7.  Once the change has been approved we will inform you in a comment
8.  We will close the pull request, feel free to delete the now obsolete branch
