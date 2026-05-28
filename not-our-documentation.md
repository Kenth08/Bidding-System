LEXCHAIN: A BLOCKCHAIN-ANCHORED LEGAL DOCUMENT REPOSITORY SYSTEM WITH OCR AND NLP-POWERED DOCUMENT SUMMARIZATION









Presented to the
Institute of Computing
Davao del Norte State College
Panabo City, Davao del Norte






In Partial Fulfillment
of the Requirements for the Degree
BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY






BADYGIN I. SINCO
MARVIN A. PESCOS
SEAN AGUSTINE L. ESPARAGOZA




JUNE 2026

CHAPTER 1
INTRODUCTION

Background of Study

In the digital era, the management and preservation of legal documents remain a significant challenge, particularly in environments where paper-based systems are still widely used [1]. Contracts such as deeds of sale, lease agreements, and employment records are often stored in physical form, making them vulnerable to loss, damage, forgery, and unauthorized alterations [2]. Inefficient document management practices have been associated with delays in legal processes, increased operational costs, and disputes related to document authenticity [3].

In response, digital transformation has introduced technologies that improve document handling, accessibility, and verification [4]. Optical Character Recognition (OCR) enables the conversion of scanned documents into machine-readable text, thereby enhancing storage efficiency and searchability [5]. However, OCR performance is highly dependent on image quality and preprocessing techniques, which directly affect accuracy and reliability [6]. Complementing this, Natural Language Processing (NLP) facilitates the automated extraction and summarization of key information such as parties, dates, and contractual obligations, reducing reliance on manual document review [7]. Advanced NLP techniques further enhance efficiency by transforming unstructured legal text into structured and meaningful insights [8].

In addition, blockchain technology provides a secure and tamper-resistant mechanism for verifying document integrity through cryptographic hashing and decentralized storage [9]. Once recorded on the blockchain, any modification to a document can be detected, thereby strengthening trust and transparency in document management systems [10]. These capabilities make blockchain particularly suitable for applications requiring reliable data verification and auditability [11].

Several existing systems have attempted to address document management challenges using different combinations of these technologies. For instance, ChainDoc [12] and Docufi [13] utilize blockchain mechanisms to ensure document traceability and integrity, while CodeLegal [14] incorporates access control features to restrict document usage to authorized users. DocuSignIAM [15] emphasizes secure and scoped document access within enterprise environments, and Evisort [16] integrates NLP-based document analysis and summarization with access management features. While these systems demonstrate the potential of individual technologies or partial integrations, they often focus on specific functionalities rather than providing a fully unified solution.

Despite these advancements, many institutions in the Philippines continue to rely on fragmented and manual systems for storing and verifying legal documents [17]. This reliance results in inefficiencies in document retrieval, limited verification capabilities, and an increased risk of data loss or manipulation [18]. Similar challenges are observed at the local level, particularly the absence of a centralized and secure platform that integrates document processing, analysis, and verification [19].

Existing studies on document management systems emphasize the need for integrated digital solutions to address these issues and improve overall efficiency [20]. Furthermore, this study aligns with the United Nations Sustainable Development Goals (SDGs), particularly SDG 9 and SDG 16, which promote the adoption of innovative technologies and the development of transparent and efficient institutional systems [21]. Given these challenges, there is a clear need for a system that integrates document digitization, intelligent processing, and secure verification [22].

Thus, this study proposes the development of a Blockchain-Anchored Legal Document Repository System with OCR and NLP-Powered Document Summarization (LEXCHAIN) to improve document accessibility, enhance information extraction, and ensure data integrity through advanced technologies [23].

Objectives of the Study
This study aims to develop a Blockchain-Anchored Legal Document Repository System with OCR and NLP-Powered Document Summarization that enhances the storage, processing, and verification of legal documents through secure and intelligent technologies. Specifically, the study aims to achieve the following: 
Provide a secure blockchain-anchored digital repository where users can store scanned legal documents, including deeds of sale, lease agreements, employment contracts, and other related records, for safer preservation, controlled access, and further processing. 
Convert stored legal documents into machine-readable text using Optical Character Recognition (OCR), then apply Natural Language Processing (NLP) to extract and summarize key information, with user validation to ensure accuracy. 
Extract and summarize key contract information using Natural Language Processing (NLP), including the following:
Involved parties,
Dates,
Obligations,
Relevant clauses
Generate a unique cryptographic hash of each document and anchor it to the blockchain to ensure data integrity and enable tamper verification.
Organize and link related documents under a single transaction or property reference to support document chain tracking and validation.
Provide an intelligent, access-governed search and retrieval feature that allows users to access authorized documents using keywords, document type, or extracted data.
Produce verification results that confirm the authenticity and integrity of documents based on blockchain records.

Significance of the Study
The proposed Blockchain-Anchored Legal Document Repository System with OCR and NLP-Powered Document Summarization is expected to provide significant benefits to various stakeholders by improving document security, controlled accessibility, and verification processes. The beneficiaries are presented from most to least impacted by the system.

Document owners. The primary beneficiaries of the system as it provides a secure, permanent, and centralized digital repository for legal documents. Through OCR and intelligent processing, users can easily store, access, and retrieve documents without relying on physical copies. This reduces the risk of document loss, damage, and unauthorized modification.

Whitelisted participants, notaries, and authorized issuers. benefit from the system through the availability of a tamper-resistant digital registry. By anchoring document hashes on the blockchain, the system enhances record authenticity and minimizes disputes related to document validity. It also improves efficiency by reducing reliance on manual logbooks and traditional record-keeping methods.

Verifiers and Legal Practitioners. Legal practitioners and document verifiers benefit from the system’s ability to provide fast and reliable document integrity checking. The blockchain-based verification feature allows users to confirm document integrity without requiring direct coordination with issuing entities, improving efficiency in legal and administrative processes.

General Public. The system benefits the general public by providing access to document verification services, promoting transparency and trust. It reduces the time, cost, and complexity associated with verifying legal documents and resolving disputes caused by missing or questionable records.

System administrators. System administrators benefit from governance tools that support user management, audit monitoring, and incident review while maintaining controlled access over protected document content.

Davao del Norte State College (DNSC). The institution benefits from this study as it demonstrates the practical application of emerging technologies such as blockchain, OCR, and NLP in solving real-world problems. The project contributes to academic research, innovation, and the advancement of digital governance aligned with the DNSC Research, Development, and Extension (RDE) Agenda.

Scope and Limitation
This study focuses on the design and development of LEXCHAIN: A Blockchain-Anchored Legal Document Repository System with OCR and NLP-Powered Document Summarization, intended for managing legal documents in a secure, intelligent, and verifiable digital environment. The system is designed for document owners, administrative users, whitelisted participants, and external verifiers who require controlled access, document processing, and integrity verification.
The scope of the system includes the upload and storage of legal PDF documents, such as deeds of sale, lease agreements, employment contracts, memorandums, barangay resolutions, and other related legal records. Uploaded documents are processed using Optical Character Recognition (OCR) to extract machine-readable text from scanned files. The extracted text is then processed using Natural Language Processing (NLP) and AI-powered summarization to identify and summarize important information, such as involved parties, dates, obligations, relevant clauses, and other key document details.
The system also includes document categorization, allowing uploaded records to be organized according to document type, transaction, case, or property reference. Related documents may be linked together to support document chain tracking and easier retrieval. In addition, LEXCHAIN provides an intelligent and access-governed search feature that allows users to view and retrieve only the documents they own or documents for which they have been granted permission.
Since blockchain is a core component of the system, LEXCHAIN includes blockchain-based verification and record integrity checking. For every uploaded document, the system generates a cryptographic hash that serves as the document’s unique digital fingerprint. This hash is anchored to the blockchain to support tamper-evident verification. During verification, the system compares the hash of a submitted file with the blockchain-anchored record to determine whether the document remains unchanged. External verifiers may verify document integrity based on the permissions and verification rules set by the system.
The study is limited to the processing and verification of uploaded PDF documents only. The system does not support all file formats and does not guarantee accurate processing of documents that are blurred, incomplete, handwritten, damaged, poorly scanned, or unreadable. The accuracy of OCR text extraction and NLP/AI summarization depends on the quality, clarity, and structure of the uploaded document. User validation may still be required to confirm extracted text and summarized information.
The system does not generate legal advice, legal opinions, or legal interpretations. It does not determine the legal validity, enforceability, truthfulness, or authenticity of the document content. Legal interpretation and formal validation must still be performed by authorized legal professionals, notaries, government agencies, or proper institutions.
Blockchain in the system is used only for document integrity verification, not for storing the full document content. The actual legal documents are stored in the system repository, while only the document hash or integrity record is anchored to the blockchain. Therefore, blockchain verification can confirm whether a file matches its previously recorded version, but it cannot prove whether the information inside the document is legally true or valid.
The system also does not include direct integration with external government systems such as the Bureau of Internal Revenue (BIR), Registry of Deeds, Land Registration Authority (LRA), or local government units (LGUs). As a result, it does not support official legal processes such as ownership transfer, government validation, land registration, or tax-related verification.
Confidential document access depends on the system’s permission settings. Users may only view, search, or verify documents based on their assigned roles, ownership, or whitelist authorization. However, the confidentiality of documents also depends on proper user account management and responsible permission assignment by the system users or administrators.
Finally, the system is implemented as a web-based platform and requires a stable internet connection for document upload, processing, access, and blockchain interaction. System performance, including processing speed, verification response time, data security, and reliability, may vary depending on network conditions, server capacity, document size, and available hardware resources.
Review of Related Literature and Works
Related Literature
This section presents a critical review of existing literature related to document digitization, intelligent text processing, legal document management, and secure data verification. It aims to examine current research trends and identify the gaps that justify the development of the proposed system [24]. The integration of Optical Character Recognition (OCR), Natural Language Processing (NLP), and blockchain technology has become increasingly relevant in document management systems because these technologies support automated text extraction, intelligent analysis, and tamper-evident verification [25].
Document management systems have evolved from traditional paper-based storage to digital platforms that support faster retrieval, better organization, and improved record preservation. However, many organizations still experience challenges related to fragmented storage, slow document retrieval, weak access control, and difficulty in verifying document integrity. These issues are especially critical in legal document management because contracts, deeds, affidavits, employment records, and official documents may affect ownership, obligations, rights, and institutional accountability.
OCR plays an important role in document digitization because it converts scanned files and image-based documents into machine-readable text [26]. Modern OCR systems have improved in accuracy and efficiency, but their performance remains dependent on the quality of the input document [27]. Poor image resolution, noise, skewed pages, damaged paper, and unclear printed text may reduce OCR accuracy. For this reason, preprocessing methods such as thresholding, noise reduction, and image enhancement are commonly applied to improve OCR output [28]. In relation to LEXCHAIN, OCR serves as the first processing layer because uploaded legal PDF documents must be converted into readable text before they can be summarized, categorized, and searched.
A local study by Censoro developed a document management system using Optical Character Recognition, clustering, watermarking, and QR coding algorithms [73]. The study is relevant to LEXCHAIN because it shows how OCR can be applied in a Philippine document management context to improve document storage and retrieval. However, the system focused mainly on OCR-based digitization, document clustering, watermarking, and QR coding. LEXCHAIN builds on this idea by applying OCR to legal documents and combining it with NLP/AI summarization, access-governed search, and blockchain-based integrity verification.
Another local-related system is the Blockchain-Based Barangay Document Management System with OCR Data Extraction [74]. This system used OCR and blockchain to address manual document handling in Philippine barangays. It is related to LEXCHAIN because both systems recognize the need to digitize documents and improve trust through blockchain-based verification. However, the barangay system focuses on barangay-level records, while LEXCHAIN focuses on legal documents such as deeds of sale, lease agreements, employment contracts, memorandums, and barangay resolutions. LEXCHAIN further extends the concept by including NLP/AI summarization, document categorization, whitelisted participant access, access-scoped search, and document chain linking.
NLP has expanded the capabilities of document processing by enabling automated understanding and analysis of textual content [29]. Techniques such as text summarization, named entity recognition, and information extraction are widely used to reduce manual review and extract important information from large volumes of text [30]. Recent advancements in deep learning and transformer-based models have further improved NLP performance in text analysis and summarization tasks [31]. These methods allow systems to transform unstructured text into structured information that can support faster review and decision-making [32]. In LEXCHAIN, NLP/AI summarization is used to extract and summarize key legal document information, including involved parties, dates, obligations, and relevant clauses.
Blockchain technology introduces a tamper-evident approach to document verification by recording data in a decentralized and immutable ledger [33]. Once a record is stored on the blockchain, later modifications can be detected through cryptographic comparison [34]. Blockchain has been used in document verification because it supports data integrity, auditability, and tamper detection [35]. In the context of LEXCHAIN, blockchain is not used to store the full legal document. Instead, the system generates a cryptographic hash of the document and anchors that hash on the blockchain. This allows the system to verify whether a submitted file still matches the original uploaded file.
A relevant local initiative is the Department of Budget and Management’s blockchain application for the Action Document Releasing System [75]. The DBM system uses blockchain to secure, track, and validate government budget-related documents. This is related to LEXCHAIN because both systems use blockchain to strengthen document integrity and transparency. However, the DBM system is focused on government budget documents, while LEXCHAIN is designed as a legal document repository that includes OCR extraction, NLP/AI summarization, permission-based viewing, and public verification of document integrity.
Another relevant blockchain-based document handling solution is Doconchain, which provides blockchain-based digital signature and authentication solutions for local governments and barangays [76]. This system is related to LEXCHAIN because both aim to improve trust in official or legal documents through blockchain-supported verification. However, Doconchain focuses mainly on digital signatures and authentication, while LEXCHAIN focuses on a broader workflow that includes legal document storage, OCR text extraction, NLP/AI summarization, document categorization, access-governed retrieval, and blockchain hash verification.
The SECHash model is another related study that integrates blockchain and OCR for e-government document management [77]. The study proposed the use of blockchain and OCR to regulate incoming documents in government agencies. It is related to LEXCHAIN because both systems combine OCR and blockchain to improve document processing and integrity. However, SECHash focuses on government document processing, while LEXCHAIN focuses on legal document management and adds NLP/AI summarization, access control, verification logs, and document chain linking.
Several existing systems also demonstrate how document management, access control, AI, and blockchain verification are applied in real-world platforms. ChainDoc [12] and Docufi [13] focus on blockchain-based document tracking and verification, showing the usefulness of tamper-resistant records. CodeLegal [14] provides legal document automation and access-related features, which relate to LEXCHAIN’s permission-based access. DocuSign Intelligent Agreement Management [15] supports agreement management and controlled document workflows. Evisort [16] uses AI-powered contract analysis and summarization, which relates to the NLP/AI feature of LEXCHAIN.
A synthesis of the reviewed literature shows that OCR, NLP, blockchain, and access control are commonly used to improve different aspects of document management. OCR supports document digitization and searchability. NLP supports document understanding and summarization. Blockchain supports integrity verification and tamper detection. Access control supports confidentiality and authorized viewing. However, most existing systems focus on only one or two of these functions. This limitation highlights the need for a unified system that integrates OCR text extraction, NLP/AI summarization, document categorization, permission-based access, blockchain-based integrity verification, and document chain linking within a single legal document repository. LEXCHAIN addresses this gap by combining these features into one platform for secure and intelligent legal document management.
Related Works
	Various systems and studies have been developed to address document management, OCR processing, NLP/AI summarization, blockchain-based verification, and legal document handling. Each related work is discussed below to show its connection to the proposed LEXCHAIN system and to identify how LEXCHAIN differs from existing solutions.
Document Management System using Optical Character Recognition, Clustering, Watermarking, and QR Coding Algorithms.
	Censoro developed a document management system that used OCR, clustering, watermarking, and QR coding algorithms for document organization and security [73]. This study is related to LEXCHAIN because both systems use OCR to convert scanned documents into machine-readable text. However, Censoro’s system focused mainly on document storage, clustering, watermarking, and QR code-based identification. LEXCHAIN extends this approach by applying OCR specifically to legal documents and integrating NLP/AI summarization, permission-based document access, blockchain hash anchoring, and verification logs.
Blockchain-Based Barangay Document Management System with OCR Data Extraction.
	This system integrated OCR and blockchain to address manual document handling in Philippine barangays [74]. It is closely related to LEXCHAIN because both systems combine OCR and blockchain for document management and verification. However, the barangay system is focused on barangay records, while LEXCHAIN is focused on legal documents such as deeds of sale, lease agreements, employment contracts, memorandums, and barangay resolutions. LEXCHAIN also adds NLP/AI-powered document summarization, access-scoped search, document categorization, and document chain linking.
DBM Blockchain Application for the Action Document Releasing System.
	The Department of Budget and Management launched a blockchain application for its Action Document Releasing System to secure, track, and validate government budget documents [75]. This system is related to LEXCHAIN because both use blockchain for document integrity and verification. However, the DBM application is designed for government budget document tracking, while LEXCHAIN is designed for legal document repository management. LEXCHAIN also includes OCR text extraction, NLP/AI summarization, permission-based viewing, and public document integrity checking.
Doconchain.
	Doconchain provides blockchain-based digital signature and authentication solutions for local governments and barangays [76]. It is related to LEXCHAIN because both systems use blockchain to improve trust and authenticity in documents. However, Doconchain mainly focuses on digital signatures and authentication. LEXCHAIN differs by providing an integrated repository that includes legal document upload, OCR extraction, NLP/AI summarization, document categorization, whitelist-based access, blockchain hash verification, and document chain linking.
SECHash.
	The SECHash model integrates blockchain and OCR for e-government document processing [77]. This study is related to LEXCHAIN because both systems use OCR to process document content and blockchain to support document integrity. However, SECHash is designed for government incoming document processing, while LEXCHAIN focuses on legal document storage, summarization, categorization, and verification. LEXCHAIN also includes permission-based viewing and verification features for document owners, whitelisted participants, administrators, and external verifiers.
ChainDoc.
	ChainDoc focuses on blockchain-based document tracking and verification [12]. It is related to LEXCHAIN because both systems use blockchain to provide tamper-evident document records. However, ChainDoc mainly emphasizes document traceability and verification. LEXCHAIN expands this by adding OCR text extraction, NLP/AI document summarization, whitelisted access control, access-scoped search, and document chain linking.
Docufi.
	Docufi provides blockchain-based document verification and traceability [13]. This system is related to LEXCHAIN because both systems aim to verify documents through blockchain-supported mechanisms. However, Docufi focuses primarily on document verification, while LEXCHAIN combines verification with legal document storage, OCR extraction, NLP/AI summarization, permission-based access, and intelligent retrieval.
CodeLegal.
	CodeLegal provides legal document automation and compliance-related features [14]. It is related to LEXCHAIN because both systems address legal document workflows and controlled document handling. However, CodeLegal is more focused on legal automation and compliance support. LEXCHAIN focuses on the secure storage, processing, and verification of legal documents through OCR, NLP/AI, and blockchain hash anchoring.
DocuSign Intelligent Agreement Management.
	DocuSign IAM supports agreement management, document workflows, and controlled access to agreement-related records [15]. It is related to LEXCHAIN because both systems support the management of important legal or agreement-based documents. However, DocuSign IAM is primarily enterprise-oriented and agreement-management focused. LEXCHAIN is designed as a legal document repository that integrates OCR extraction, NLP/AI summarization, permission-based access, and blockchain-based integrity verification.
Evisort.
	Evisort is an AI-powered contract management platform that uses artificial intelligence to analyze contracts and extract relevant information [16]. It is related to LEXCHAIN because both systems use AI/NLP to support document analysis and summarization. However, Evisort focuses mainly on contract intelligence and contract lifecycle management. LEXCHAIN differs by integrating AI-powered summarization with blockchain-based hash verification, access-governed search, document categorization, and document chain linking.

System / Study
OCR Text Extraction
NLP / AI Summarization
Blockchain-Based Verification
Permission-Based Access
Access-Scoped Search
Document Categorization
Document Chain Linking
Document Management System using OCR, Clustering, Watermarking, and QR Coding [73]
✓








✓


Blockchain-Based Barangay Document Management System with OCR [74]
✓


✓
✓


✓


DBM Blockchain Application / ADRS [75]




✓




✓


Doconchain [76]




✓
✓


✓


SECHash [77]
✓


✓




✓


ChainDoc [12]




✓




✓
✓
Docufi [13]




✓




✓
✓
CodeLegal [14]






✓


✓


DocuSign IAM [15]


✓


✓
✓
✓


Evisort [16]


✓


✓
✓
✓


LEXCHAIN
✓
✓
✓
✓
✓
✓
✓


Table 1. Comparison table of the existing system vs. the proposed system.

	Table 1 shows that existing systems address different parts of document management. Some systems focus on OCR-based digitization, while others focus on blockchain verification, digital authentication, access control, or AI-powered contract analysis. However, most of these systems do not combine OCR text extraction, NLP/AI summarization, blockchain-based document integrity verification, permission-based access, access-scoped search, document categorization, and document chain linking in one platform. LEXCHAIN fills this gap by providing a unified legal document repository system that supports secure storage, intelligent processing, controlled access, and tamper-evident verification. 
Definition of Terms
Blockchain. Refers to the decentralized digital ledger used in the system to securely store the cryptographic hash of each document, ensuring immutability and enabling tamper verification.
Blockchain Anchoring. Refers to the process of generating and recording a document’s hash on the blockchain to establish a permanent and verifiable proof of its integrity.
Cryptographic Hash. Refers to the unique fixed-length string generated from a document’s content, which is used in the system to detect any modification or tampering of the document.
Document Chain Linking. Refers to the system feature that connects related documents under a single transaction or property reference, allowing users to track and validate document relationships.
Document Repository. Refers to the centralized digital storage within the system, where all uploaded legal documents are securely stored and managed.
Document Summarization. Refers to the NLP-based process used in the system to generate concise summaries by extracting key information such as parties, dates, obligations, and clauses from legal documents.
Intelligent Search. Refers to the system functionality that enables users to retrieve authorized documents using keywords, document types, or extracted metadata derived from OCR and NLP processing.
Natural Language Processing (NLP). Refers to the technology used in the system to analyze, extract, and summarize textual information from digitized legal documents.
Optical Character Recognition (OCR). Refers to the technology used in the system to convert scanned or uploaded document images into machine-readable text for further processing.
Participant Management. Refers to the system feature that allows users to assign and manage document-level access permissions for individuals associated with a document.
Whitelisted Participant. 
Refers to a user who has been explicitly granted document-level permission to access a specific record within the system.
LexChain System. Refers to the proposed system that integrates OCR, NLP, and blockchain technologies to securely store, process, and verify legal documents.
Tamper Verification. Refers to the process of validating whether a document has been altered by comparing its current hash with the hash stored on the blockchain.
Verification Log. Refers to the system-generated record that stores details of document verification attempts, including results, timestamps, and user activity.
Access Control. Refers to the mechanism that restricts access to system resources based on user roles and document-level permissions to ensure data confidentiality and security.
Audit Trail. Refers to a chronological record of system activities, including document uploads, access events, and verification attempts, used for monitoring and accountability.
Document Integrity. Refers to the assurance that a document remains complete, unaltered, and consistent from the time it was uploaded to the system.
Hash Comparison. Refers to the process of comparing a newly generated hash of a document with the stored blockchain hash to determine whether the document has been modified.
Metadata. Refers to descriptive information about a document, such as file name, upload date, document type, and ownership details, used for organization and retrieval.
Role-Based Access Control (RBAC). Refers to a system-level access control approach where permissions are assigned based on user roles such as admin, user, or verifier.

CHAPTER 2
METHODOLOGY

This chapter presents the methodology used in developing the Blockchain-Anchored Legal Document Repository System with OCR and NLP-Powered Document Summarization. It outlines the processes, tools, and approaches applied to ensure the system meets the identified requirements for secure document storage, intelligent processing, and reliable verification.
Unlike traditional linear models, the study adopts the Agile–Scrum Software Development Model, which emphasizes iterative development, continuous feedback, and incremental delivery of system features. This approach enables the proponents to adapt to changing requirements, improve system functionality through repeated cycles, and ensure higher quality outputs at every stage of development.
The development process is structured into key phases Planning, Analysis, Design, Implementation, Testing & Iteration, and Maintenance integrated within an Agile framework. Each phase is executed through sprints, allowing specific components such as OCR processing, NLP-based summarization, and blockchain integration to be developed, tested, and refined progressively.
The Planning Phase focuses on identifying user requirements and defining the product backlog. The Analysis Phase evaluates system feasibility and determines technical needs. During the Design Phase, system architecture and core components are structured. The Implementation Phase involves the development of OCR, NLP, and blockchain modules. This is followed by Testing and Iteration, where sprint reviews, feedback loops, and continuous improvements are conducted. Finally, the Maintenance Phase ensures system updates, optimization, and scalability.By adopting the Agile–Scrum model, the study promotes flexibility, collaboration, and continuous improvement, ensuring that the system evolves effectively while maintaining alignment with user needs and technological requirements.

Figure 1. LEXCHAIN Agile-Scrum Model

System Planning
The planning phase focused on identifying issues in manual and fragmented legal document management, such as difficulty in retrieval, risk of data loss, and lack of verification mechanisms. Based on these challenges, the proponents proposed a system that integrates OCR for digitization, NLP for information extraction, and blockchain for document integrity.
This phase also involved defining the project scope, identifying system users, selecting technologies, assigning team roles, and preparing the development schedule.

Project Team Organization
The Capstone Project team consists of three (3) members assigned specific roles to ensure the effective development and documentation of the proposed system, as shown in Figure 2. The Programmer is responsible for designing the system architecture and database, developing system features, and integrating core functionalities such as Optical Character Recognition (OCR), Natural Language Processing (NLP), and blockchain technology. The Documentarian is responsible for preparing and organizing the research manuscript, ensuring that all documentation complies with academic standards and accurately reflects the system’s development. Meanwhile, the System Analyst is tasked with analyzing system requirements, ensuring proper coordination of system components, and translating user needs into functional system specifications.

Figure 2. Project Management Team Organization

Work Breakdown Structure
The Work Breakdown Structure (WBS) organizes the development activities of the proposed system based on the PADIM framework: Planning, Analysis, Design, Implementation, and Maintenance. In the planning phase, the proponents defined the project problem, objectives, scope, users, and selected the necessary technologies. The analysis phase focused on gathering system requirements and developing diagrams such as the Use Case Diagram and Data Flow Diagrams. In the design phase, the system architecture, database structure, and user interface were prepared. The implementation phase involved developing the system modules, including OCR, NLP, and blockchain integration, followed by testing and debugging. Lastly, the maintenance phase includes planning for system updates, security, and future improvements to ensure system sustainability.
Figure 3. Project Management Team Organization






Gantt Chart
The Gantt Chart presents the timeline of the project based on the PADIM framework, covering the phases of Planning, Analysis, Design, Implementation, Maintenance, and Documentation. It illustrates the schedule of activities from January to June 2026, showing the duration and sequence of each phase. This timeline serves as a guide for monitoring project progress and ensuring that all development tasks are completed within the planned timeframe.

Figure 4. Project Gantt Chart
System Analysis
This section describes the analysis phase of the system development, focusing on how the proposed system operates, the interactions between users and system components, and the required functionalities. The analysis phase ensures that all system requirements are clearly defined before proceeding to the design and implementation stages.
System Architecture
Figure 5 illustrates the overall system architecture of the proposed Blockchain-Anchored Legal Document Repository System with OCR and NLP-Powered Document Summarization. The architecture presents a structured flow of data and processes across multiple layers, starting from user interaction up to document verification. The process begins at the client interface, where users, administrators, whitelisted participants, and external verifiers access the system through a web or mobile application to upload, search, and verify legal documents according to their permitted functions. Uploaded documents undergo preprocessing and Optical Character Recognition (OCR) to convert them into machine-readable text, followed by user validation to ensure accuracy. Subsequently, Natural Language Processing (NLP) is applied to extract and summarize key information, including involved parties, dates, obligations, and relevant clauses.
After processing, the system generates a cryptographic hash of the document, which is then anchored to the blockchain to ensure data integrity and enable tamper-evident verification. The processed documents and extracted data are securely stored in the data storage layer, while the corresponding hash and metadata are permanently recorded on the blockchain network. The system also supports search and retrieval functionalities, allowing users to access only documents they own or documents for which they have active permission, together with their summarized insights. For verification, the system compares the hash of a retrieved or submitted document with the blockchain-stored hash to determine integrity status. The architecture ensures a secure, efficient, and transparent workflow by integrating document processing, access control, storage, and blockchain-based verification within a unified system, as supported by the architecture summary.

                      SYSTEM ARCHITECTURE 
Figure 5. System architecture of the project.
Functional and Non-Functional Requirements
The functional requirements describe the core features and operations of the system.
The system shall allow users to register and log in securely.
The system shall allow users to upload legal documents.
The system shall convert uploaded documents into machine-readable text using OCR.
The system shall extract and summarize key information using NLP.
The system shall generate and store document hashes for blockchain anchoring.
The system shall allow users to verify document authenticity.
The system shall provide intelligent, access-governed search and retrieval of authorized documents.
The system shall allow management of document participants and document-level permissions.
The system shall restrict access to documents based on ownership or active whitelist authorization.
The non-functional requirements describe the system’s quality attributes and operational constraints.
Performance: The system should process documents within an acceptable response time.
Security: The system must ensure data protection through encryption and secure access control.
Reliability: The system should maintain consistent performance with minimal downtime.
Usability: The system interface should be user-friendly and easy to navigate.
Scalability: The system should support an increasing number of users and documents.
Availability: The system should be accessible online with minimal interruptions.

Use Case Diagram
Figure 6 presents the use case diagram of the proposed system and illustrates how the different actors interact with its major functionalities. The diagram identifies three primary actors: the User, the Admin, and the Public Verifier. The User performs the core operations of the system, including logging in, registering an account, uploading legal documents, managing document participants, viewing document status, searching authorized documents, and viewing document insights. As part of document processing, the uploaded legal document passes through the intelligence pipeline, which includes text extraction through Optical Character Recognition (OCR) and summarization and entity extraction through Natural Language Processing (NLP). 
These processes support the generation of meaningful document insights and the anchoring of the document hash for integrity verification. The Public Verifier is an external actor who is allowed to submit a document for verification and view the corresponding verification result without full internal access to the repository or protected document content. Meanwhile, the Admin is responsible for managing user accounts, viewing system statistics, and monitoring audit logs to maintain system governance and security, but does not automatically gain unrestricted access to all confidential records. Overall, the use case diagram shows how the proposed system supports secure legal document management, intelligent document processing, and blockchain-based verification through the coordinated interaction of its actors and system functions.

Figure 6. Use Case Diagram
Context Flow Diagram
Figure 7 illustrates the context flow diagram of the proposed LexChain system, showing the high-level interaction between the system and its external entities. The diagram identifies two primary external actors: the Document Issuer and the Public Verifier. The Document Issuer provides account details and legal documents as inputs to the system and, in return, receives dashboard information and document insights. Meanwhile, the Public Verifier submits a document for verification and receives a verification certificate generated by the system. At the center of the diagram is the LexChain system, which serves as the core processing unit that manages all data exchanges between the external entities. This context diagram defines the system boundary and emphasizes the major data flows without exposing internal processes. Overall, it demonstrates how the system facilitates secure document submission, processing, and blockchain-based verification through controlled and structured data interactions.
Figure 7. Context flow diagram of the system.
Data Flow Diagram
Figure 8 presents the Level 0 Data Flow Diagram (DFD) of the proposed LexChain system, illustrating the major processes, data flows, and data stores involved in the system’s operation. The diagram begins with the Document Issuer, who provides login credentials that are processed by the authentication module to validate user access through the Users database. Once authenticated, the user can upload legal documents, which are stored in the Documents database and tracked through document status updates. The system also allows the addition of participants, where participant records are stored in the Participants database to support controlled, document-level access.

The uploaded documents are then forwarded to the processing intelligence module, where key information such as insights and party names are extracted and stored in the Insights and Parties databases. After processing, the document undergoes blockchain anchoring, where a cryptographic hash is generated and stored in the Blockchain Anchors database to ensure data integrity. Finally, the system performs document verification by comparing the document against its stored blockchain record. The verification process generates logs stored in the Verification Logs database and produces a verification result for the Public Verifier. Overall, the diagram demonstrates how data flows through different system components, ensuring secure document processing, structured data storage, and reliable blockchain-based authenticity verification.
Figure 8. Data flow diagram of the system.

System Design 
This section presents the design phase of the proposed system, which includes the database structure, system components, and technologies used in the development. It defines how the system is structured and how data is organized, processed, and managed.

Entity Relationship Diagram (ERD)
Figure 9 presents the final Entity Relationship Diagram of the proposed LexChain system. The ERD illustrates the database structure required to support the system’s major functions, including user management, role assignment, legal document storage, document categorization, OCR text extraction, NLP/AI summarization, blockchain-based integrity verification, permission-based access, participant invitation, verification tracking, notifications, and administrative monitoring.
The Users entity stores the account information of registered users, while the Roles entity defines system-level roles such as administrator, document owner, participant, or verifier. The Documents entity serves as the central entity of the system because it stores the metadata of uploaded legal documents, including the owner, document category, storage location, content type, status, and generated document hash. The Document_Categories entity organizes uploaded documents according to their type, such as deeds of sale, lease agreements, employment contracts, memorandums, and barangay resolutions.
The Extracted_Text entity stores the OCR-generated text from uploaded legal PDF documents, including the raw extracted text, OCR confidence score, and processing status. The Document_Summaries entity stores the NLP/AI-generated summary and structured extracted information. The field Extracted_Data_JSON is used to store flexible AI-extracted information such as involved parties, dates, obligations, clauses, and other relevant metadata. This JSON field is used only as assistive metadata for search and summarization and should not be interpreted as legal advice or official legal interpretation.
The Document_Parties entity stores the persons or organizations identified in each legal document. The Blockchain_Records entity stores blockchain-related information, including the document hash, transaction hash, block number, network, and anchoring timestamp. The full document is not stored on the blockchain. Only the document hash or integrity record is anchored to support tamper-evident verification.
The Document_Permissions entity manages document-level access control by defining which users are allowed to view, verify, or manage specific documents. The Invited_Participants entity stores invitation records for external or registered users who are invited to access a document. The Verification_Logs entity records document verification attempts, including the submitted hash, blockchain hash matching result, verification result, verifier information, IP address, and timestamp.
The Notifications entity stores system-generated messages related to document uploads, OCR completion, NLP summary generation, blockchain anchoring, permission updates, invitations, and verification results. The Admin_System_Logs entity records administrative and system-level activities, including user actions, document-related actions, permission changes, and system events. The field Details_JSON stores structured details of logged activities, such as previous values, updated values, error details, or permission changes.
Overall, the final ERD provides a structured database design that supports secure legal document storage, intelligent document processing, controlled document access, blockchain-based verification, user notifications, and system auditability within the LexChain system.

Figure 9. Entity relationship diagram of the system.




Data Dictionary
The data dictionary defines the structure of the database used in the proposed LexChain system. It presents the field names, data types, and descriptions of each table to ensure consistency in storing, processing, retrieving, and verifying legal documents. The database is composed of seven core tables: Users, Documents, Document_Participants, Document_Insights, Document_Parties, Blockchain_Anchors, and Verification_Logs. These tables support the major functions of the system, including user management, document repository handling, participant access control, OCR and NLP processing output storage, blockchain anchoring, and authenticity verification. The relationships among these tables enable the system to maintain structured records, preserve document integrity, and support secure and auditable legal document management.

Table No.
Table Name
1.1
Users
1.2
Documents
1.3
Document_Participants
1.4
Document_Insights
1.5
Document_Parties
1.6
Blockchain_Anchors
1.7
Verification_Logs


Table 2. List of Database Tables

Field Name
Data Type
Description
UserID
UUID
Unique identifier of the user
Email
VARCHAR
User email address
FirstName
VARCHAR
User first name
LastName
VARCHAR
User last name
Role
VARCHAR
User role in the system
CreatedAt
TIMESTAMP
Date of account creation
UpdatedAt
TIMESTAMP
Date and time of the latest account update


Table 2.1 Users

Field Name
Data Type
Description
DocID
UUID
Unique identifier of the document
UserID
UUID
Identifier of the document owner or uploader
FileName
VARCHAR
Name of the uploaded file
Storage_URL
VARCHAR
Storage location or URL of the document
Status
VARCHAR
Current processing or verification status of the document
CreatedAt
TIMESTAMP
Date and time the document was uploaded
Document_Hash
VARCHAR
Generated a cryptographic hash of the document
Content_Type
VARCHAR
File type or MIME type of the uploaded document


Table 2.2 Documents_Participants

Field Name
Data Type
Description
ParticipantID
UUID
Unique identifier of the participant record
DocID
UUID
Identifier of the linked document
UserID
UUID
Identifier of the linked user
Role
VARCHAR
Document-level permission of the participant
AddedAt
TIMESTAMP
Date and time the participant was added


Table 2.3 Document_Participants

Field Name
Data Type
Description
InsightID
UUID
Unique identifier of the insight record
DocID
UUID
Identifier of the linked document
Summary
TEXT
Generated summary of the document
Confidence_Score
DECIMAL
Confidence score of the NLP output
ProcessedAt
TIMESTAMP
Date and time the document was processed
Extracted_Text
TEXT
OCR-extracted text from the uploaded document
Embedding_Vector
VECTOR / TEXT
Vector representation used for semantic search or document intelligence


Table 2.4 Document_ Insights

Field Name
Data Type
Description
PartyID
UUID
Unique identifier of the party record
DocID
UUID
Identifier of the linked document
Party_Name
VARCHAR
Name of the identified party in the document
Role_In_Doc
VARCHAR
Role of the party within the legal document


Table 2.5 Document_Parties

Field Name
Data Type
Description
AnchorID
UUID
Unique identifier of the blockchain anchor record
DocID
UUID
Identifier of the linked document
Tx_Hash
VARCHAR
Blockchain transaction hash
Block_Number
INTEGER
Block number where the transaction was recorded
Network
VARCHAR
Blockchain network used for anchoring
AnchoredAt
TIMESTAMP
Date and time the document hash was anchored


Table 2.6 Blockchain_Anchors

Field Name
Data Type
Description
LogID
UUID
Unique identifier of the verification log
DocID
UUID
Identifier of the linked document
Checked_By_IP
VARCHAR
IP address of the verifier or source of the verification request
Is_Authentic
BOOLEAN
Indicates whether the document passed authenticity verification
VerifiedAt
TIMESTAMP
Date and time of the verification attempt


Table 2.7 Verification_Logs

Technologies, Concepts, and Theories
This section presents the key technologies and concepts used in the development of the proposed LexChain system. It outlines the processes involved in handling legal documents, from data acquisition to analysis and verification, ensuring a structured and intelligent workflow.


Data Collection
Data collection in the LexChain system is performed through user interaction with the web-based platform. Document owners or authorized users upload legal documents along with relevant metadata such as file name, document type, and participant information. In addition to user-provided data, the system generates operational data such as document processing results, blockchain transaction records, and verification logs. These data elements are essential for document tracking, auditability, and system monitoring.

Data Pre-Processing (OCR-Based Text Extraction)
Data pre-processing is a critical step in preparing uploaded legal documents for analysis. The system applies Optical Character Recognition (OCR) to convert scanned or image-based documents into machine-readable text. Pre-processing techniques such as noise reduction, image enhancement, and text normalization are applied to improve OCR accuracy. This stage ensures that the extracted text is suitable for further processing by the NLP module.

Natural Language Processing (NLP) for Information Extraction and Summarization
Natural Language Processing (NLP) is used to analyze the extracted text and generate meaningful insights. The system applies NLP techniques such as named entity recognition and text summarization to identify key elements within legal documents, including involved parties, important dates, obligations, and relevant clauses. The extracted information is stored as structured data and summarized content, enabling efficient document understanding, search, and retrieval.

Whitelist-Based Access Control
The system implements a whitelist-based access control mechanism to enforce document-level permissions. Unlike traditional role-based access systems, access to a document is granted only when a user is explicitly added as a participant. This ensures that sensitive legal documents remain confidential and are only accessible to authorized users. This concept supports the principle of least privilege and enhances data security within the system.

Cryptographic Hashing
Cryptographic hashing is used to generate a unique and fixed-length representation of each document. The hash is computed based on the complete content of the file, ensuring that any modification to the document will result in a different hash value. This property allows the system to detect tampering and maintain document integrity.

Blockchain Anchoring for Data Integrity
Blockchain technology is utilized to store the cryptographic hash of each document in a decentralized and immutable ledger. This process, known as blockchain anchoring, ensures that once a document hash is recorded, it cannot be altered without detection. The blockchain serves as a trusted reference for verifying document integrity and provides a transparent audit trail for validation purposes.

Document Verification and Integrity Checking
The system verifies document authenticity by comparing the hash of a submitted document with the corresponding hash stored on the blockchain. If the values match, the document is considered authentic and unchanged; otherwise, it is flagged as modified or invalid. Verification results are recorded in the system logs to support traceability and auditing.

Technologies Used in the System
This section presents the key technologies utilized in the development of the proposed LexChain system. These technologies support secure legal document storage, OCR-based text extraction, NLP-based text chunking, semantic embedding, AI-powered document analysis and summarization, blockchain-based record integrity verification, and system integration. The selected technologies were evaluated based on accuracy, performance, speed, cost, integration complexity, available documentation, benchmark capability, and suitability to the objectives of the proposed system.



Optical Character Recognition (OCR)
	Optical Character Recognition (OCR) is used in the proposed LexChain system to convert uploaded legal PDF documents, particularly scanned or image-based files, into machine-readable text. This process allows the system to extract readable content from scanned legal documents for further processing, searching, summarization, and verification. OCR is necessary because the NLP and AI analysis components require machine-readable text before they can perform chunking, embedding, summarization, and information extraction.
The proposed system will use an existing OCR tool rather than developing an OCR engine from scratch. Developing an OCR engine from the ground up would require large training datasets, image processing expertise, model development, and extensive evaluation. Tesseract OCR is an open-source OCR engine that supports text recognition through command-line execution and API-based backend integration [47]. PaddleOCR is an open-source OCR toolkit designed for multilingual and document-based text recognition tasks [49]. Google Cloud Vision OCR provides cloud-based text detection and document OCR services through API integration [51]. These technologies were compared to determine the most suitable OCR tool for LexChain.



Feature / Factor
Tesseract OCR [48] 
PaddleOCR [50] 
Google Cloud Vision OCR [52] 
Accuracy in Scanned Documents
Good accuracy for clear printed documents; may require validation for blurred, handwritten, or damaged files
High accuracy for many printed, structured, and multilingual documents
High cloud-based OCR accuracy
PDF / Image-Based PDF Support
Supports OCR processing through image and PDF conversion workflows
Supports image and document OCR workflows
Strong support for image and document text detection
Language Support
Supports multiple trained language data files
Strong multilingual support
Strong multilingual support
Speed / Performance
Runs locally and performs well for small to medium workloads
Strong performance but may require more setup and computing resources
Fast cloud-based processing
Cost
Free
Free
Paid after free tier or usage limits
Open-Source Availability
Yes
Yes
No
Ease of Integration
Practical for backend integration through command-line execution and programming wrappers
Moderate integration due to dependencies and setup requirements
Easy API integration but requires billing and internet connectivity
Suitability for LexChain
Highly suitable for capstone implementation because it is locally deployable and cost-efficient
Suitable for advanced OCR but heavier for initial implementation
Suitable for production-level OCR but increases cloud and cost dependency
Reason for Selection
Selected because it is open-source, free, practical for backend integration, and suitable for extracting readable text from uploaded legal PDF documents
Not selected because it may require more configuration, dependencies, and computing resources
Not selected because the system aims to reduce reliance on paid cloud OCR services


Table 3. Comparison of OCR Technologies 

Based on the comparison, Tesseract OCR is selected as the OCR technology for the proposed system because it is open-source, free to use, and suitable for local backend integration [47]. Tesseract OCR supports command-line and backend API integration, which makes it practical for a web-based capstone system [48]. However, OCR accuracy may still depend on the clarity, resolution, and quality of the uploaded document. Therefore, user validation will be included to allow users to review and confirm the extracted text, especially when processing blurred, handwritten, damaged, or poorly scanned legal documents. 
Figure 11. OCR
z
Natural Language Processing (NLP)
Natural Language Processing (NLP) is used in LexChain to process and analyze the text extracted from legal documents. In the proposed system, NLP is divided into three major functions: text chunking, semantic embedding, and AI-powered analysis. The system will use spaCy for text chunking, Sentence-BERT (SBERT) for embedding generation, and Meta Llama 3.1 70B Instruct for document analysis, summarization, and structured extraction.
The NLP pipeline begins after OCR has extracted text from the uploaded legal document. Since legal documents may contain long paragraphs and multiple clauses, the extracted text must first be divided into manageable chunks. The system uses spaCy for this task because it provides efficient tokenization and sentence segmentation capabilities [53]. After chunking, the system uses Sentence-BERT to generate semantic embeddings for text chunks. Sentence-BERT is suitable for semantic similarity and retrieval because it produces vector representations that allow the system to compare meaning rather than relying only on exact keyword matching [55]. Finally, Meta Llama 3.1 70B Instruct is used for AI-powered document analysis because it is an instruction-tuned large language model designed for text-based dialogue, summarization, and instruction-following tasks [58].


NLP Text Chunking
Text chunking is necessary because uploaded legal documents may contain lengthy paragraphs, multiple sections, and complex clauses. Processing an entire document at once may reduce the quality of analysis and may exceed model input limits. By dividing OCR-extracted text into smaller and more meaningful segments, the system can improve the accuracy of embedding, retrieval, summarization, and clause-level analysis.
Feature / Factor
spaCy [54] 
NLTK [61] 
LangChain Text Splitters [62] 
Manual Rule-Based Chunking
Text Segmentation Accuracy
Strong sentence segmentation and tokenization support
Good basic tokenization and sentence splitting
Good for LLM-oriented chunking
Depends on custom rules
Performance / Speed
Fast and efficient for large text processing
Moderate performance
Good performance depending on configuration
Fast but inconsistent
Ease of Integration
Easy to integrate in Python backend pipelines
Easy to use but less optimized for production pipelines
Easy to integrate with LLM workflows
Easy to implement but difficult to maintain
Cost
Free
Free
Free / open-source
Free
Suitability for Legal Document Processing
Suitable for breaking OCR-extracted legal text into manageable chunks
Suitable for basic text preprocessing
Suitable for retrieval-augmented generation and LLM applications
Limited for complex legal text
Suitability for LexChain
Highly suitable because it prepares long legal documents for embedding and AI analysis
Partially suitable
Suitable as optional support tool
Less suitable
Reason for Selection
Selected because it is fast, lightweight, open-source, and effective for chunking long OCR-extracted legal documents before embedding and AI processing
Not selected because spaCy is generally more efficient for pipeline-based NLP processing
Not selected as primary because spaCy provides stronger linguistic preprocessing and sentence-aware chunking
Not selected because legal documents require more reliable and maintainable text segmentation


Table 4. Comparison of NLP Chunking Technologies 

Based on the comparison, spaCy is selected for text chunking because it is fast, open-source, and suitable for sentence-aware processing of long legal documents [53]. spaCy converts raw text into structured document objects, allowing the system to process OCR-extracted text more efficiently before generating embeddings or sending selected chunks for AI analysis [54]. This makes spaCy suitable for preparing legal document text for downstream NLP and AI processing in LexChain.
Semantic Embedding
Semantic embedding is used in LexChain to represent document chunks as numerical vectors. These vectors allow the system to compare the meaning of text segments and support intelligent search and retrieval. Unlike simple keyword matching, semantic embeddings can help retrieve relevant document sections even when the user’s search terms do not exactly match the wording inside the document.
Feature / Factor
Sentence-BERT / SBERT [55] 
TF-IDF [63] 
OpenAI Embeddings [64] 
FastText [65] 
Semantic Search Accuracy
Strong semantic similarity and sentence-level representation
Good for keyword-based matching
Strong semantic embedding quality
Good for word-level representations
Performance / Speed
Efficient for generating embeddings for text chunks
Very fast
Fast API-based processing
Fast
Cost
Free if self-hosted
Free
Paid usage-based pricing
Free
Ease of Integration
Easy to integrate through the Sentence Transformers framework
Easy to implement
Easy API integration
Moderate integration
Benchmark / Capability
Designed for semantic textual similarity, clustering, and retrieval
Works well for exact keyword search
Suitable for semantic search and retrieval
Useful for word vectors and classification
Suitability for LexChain
Highly suitable for searching legal document chunks by meaning, not only by exact keywords
Limited suitability
Highly suitable but increases API cost dependency
Partially suitable
Reason for Selection
Selected because it creates meaningful embeddings for legal text chunks, enabling semantic search and better document retrieval
Not selected as primary because it does not capture deeper semantic meaning
Not selected as primary because SBERT can reduce cost and support local embedding generation
Not selected because LexChain requires sentence and document chunk embeddings rather than only word-level embeddings


Table 5. Comparison of Embedding Technologies 

Based on the comparison, Sentence-BERT / SBERT is selected for embedding generation because it is designed for semantic textual similarity, clustering, and retrieval tasks [55]. Sentence Transformers provides an accessible framework for computing embeddings and comparing similarity between text segments [56]. This supports LexChain’s intelligent search feature by allowing users to retrieve legal documents and document sections based on meaning rather than exact keyword matching alone. 
AI-Powered Document Analysis and Summarization
AI-powered document analysis is used in LexChain to generate summaries and extract important information from legal documents. After OCR extraction, chunking, and embedding, the system sends relevant text chunks to an AI analysis model. The selected model for this task is Meta Llama 3.1 70B Instruct. The model is used to analyze legal document content and identify important information such as involved parties, dates, obligations, clauses, and other relevant details.
In the proposed system, Meta Llama 3.1 70B Instruct may be accessed through a hosted inference service or third-party AI API. This approach allows the system to use a powerful instruction-tuned model without requiring the developers to train a large language model from scratch. The AI-generated output will be treated only as assistive information for document review and will not be considered legal advice, legal interpretation, or formal legal validation.

Feature / Factor
Meta Llama 3.1 70B Instruct [59] 
OpenAI API [64] 
Google Gemini API [66] 
Google Cloud Natural Language API [67] 
Smaller Open-Source LLMs
Output Quality
Strong instruction-following, summarization, and structured analysis capability
Strong structured extraction and summarization
Strong text and multimodal analysis
Good for entity analysis and classification
Depends on model size and tuning
Performance / Speed
Efficient when deployed through a hosted inference provider or optimized server
Fast API-based response
Fast depending on selected model
Stable cloud API performance
Faster and lighter
Cost
Depends on hosting/API provider; may be lower-cost than some closed APIs depending on deployment
Usage-based token pricing
Usage-based pricing
Usage-based pricing
Lower deployment cost
Benchmark / Capability
Optimized for multilingual dialogue and text-based instruction-following tasks
Strong general-purpose language model capability
Suitable for document understanding and generation
Strong for general NLP tasks
Suitable for simple summarization
Ease of Integration
Can be integrated through supported inference APIs or hosted model services
Easy API integration
Easy API integration
Easy API integration
Moderate integration
Suitability for Legal Document Analysis
Highly suitable for analyzing document chunks, generating summaries, and extracting key legal information
Highly suitable
Suitable alternative
Partially suitable
Partially suitable
Reason for Selection
Selected because it provides strong open-model analysis capability for summarization, clause identification, and structured legal document insights
Not selected because the project uses Meta Llama 3.1 70B Instruct as the chosen AI analysis model
Not selected because the system uses Meta Llama 3.1 for AI document analysis
Not selected because it is less focused on long-form summarization and legal-style analysis
Not selected because smaller models may produce weaker legal document analysis compared with a 70B instruction-tuned model


Table 6. Comparison of AI Analysis / Summarization Models 

Based on the comparison, Meta Llama 3.1 70B Instruct is selected as the AI analysis model for the proposed LexChain system because it provides strong instruction-following, summarization, and text analysis capabilities [58]. The model is part of Meta’s Llama 3.1 collection of instruction-tuned models and is optimized for multilingual dialogue and text-based instruction-following tasks [59]. This makes it suitable for analyzing legal document chunks, generating concise summaries, and extracting structured legal document information. However, the system will treat all AI outputs as assistive document insights only and not as legal advice or official legal interpretation. 

Figure 12. NLP
Blockchain Technology
Blockchain technology is integrated into LexChain to support document integrity verification and tamper-evident recordkeeping. For every uploaded legal document, the system generates a unique cryptographic hash. The generated hash serves as the document’s digital fingerprint. Instead of storing the full document on the blockchain, LexChain stores only the document hash or integrity record. This approach helps protect document confidentiality while still supporting tamper-evident verification.
The selected blockchain platform for LexChain is Base. Base is an Ethereum Layer 2 blockchain network incubated by Coinbase [68]. It is designed to provide a low-cost and developer-friendly environment for building on-chain applications [69]. Base is suitable for LexChain because the system requires repeated document hash anchoring, and using an Ethereum Layer 2 network can reduce transaction cost compared with Ethereum mainnet while still supporting EVM-compatible smart contract development.
Feature / Factor
Base [69] 
Ethereum [71] 
Polygon PoS [72] 
Hyperledger Fabric [73] 
IPFS [74] 
Mainnet / Testnet Availability
Mainnet and testnet support available
Mainnet and multiple testnets available
Mainnet and testnet options available
Private or permissioned deployment
Not a blockchain; decentralized content-addressed storage
Smart Contract Support
Supports EVM-compatible smart contracts
Strong Solidity and EVM smart contract support
EVM-compatible smart contract support
Supports chaincode / smart contract logic
No native smart contract execution
Cost / Gas Fees
Lower-cost transactions compared with Ethereum mainnet
Gas fees may become high depending on demand
Generally lower cost than Ethereum mainnet
No public gas fees, but requires infrastructure setup
Storage or pinning cost may apply
Security
Built as an Ethereum Layer 2 network
Highly secure and widely adopted
Widely used Ethereum-scaling ecosystem
Strong for enterprise permissioned systems
Provides content addressing but not blockchain consensus
Ease of Integration
Easier integration for developers familiar with Ethereum tools
Moderate integration complexity
Easy for Ethereum developers
More complex setup
Moderate integration
Documentation / Community Support
Strong documentation and Coinbase-backed ecosystem
Very large developer community
Strong documentation and community
Strong enterprise documentation
Strong documentation
Suitability for LexChain
Highly suitable for document hash anchoring and verification
Suitable but costly for frequent anchoring
Suitable alternative
Suitable for private institutional systems
Useful for file storage, but not enough for blockchain verification alone
Reason for Selection
Selected because it is an Ethereum Layer 2 network that supports EVM-compatible smart contracts with lower transaction costs, making it practical for repeated document integrity anchoring
Not selected because repeated document hash anchoring may become expensive on Ethereum mainnet
Not selected because Base was chosen for the system’s blockchain deployment
Not selected because it requires more setup and maintenance for capstone implementation
Not selected because LexChain needs blockchain-based transaction anchoring, not only decentralized storage

 
Table 7. Comparison of Blockchain Platforms / Technologies 
Based on the comparison, Base is selected as the blockchain platform for LexChain because it supports EVM-compatible smart contracts and lower-cost blockchain transactions compared with Ethereum mainnet [68]. Ethereum is highly adopted and secure, but its gas fees may become costly for repeated document hash anchoring [70]. Polygon PoS is a suitable alternative because it also supports EVM-compatible smart contracts, but Base was selected due to its developer-friendly Layer 2 environment and Coinbase-backed ecosystem [69]. Hyperledger Fabric is suitable for private enterprise blockchain deployment but requires more infrastructure setup and maintenance [73]. IPFS is useful for decentralized content-addressed storage but does not provide blockchain transaction anchoring by itself [74].
In LexChain, blockchain will be used only for document hash anchoring and integrity verification. The actual legal documents will remain stored in the system repository. This design avoids exposing confidential document contents on-chain while still enabling tamper-evident verification. Blockchain verification in LexChain confirms whether a submitted file matches its previously recorded version. It does not prove the legal truthfulness, validity, or enforceability of the document contents.

Figure 13. Blockchain



Database Management System (DBMS)
A Database Management System (DBMS) is used to organize and manage the structured data within the LexChain system. It stores essential information such as user accounts, document metadata, extracted text references, NLP-generated insights, participant records, blockchain anchor references, and verification logs. DBMS technologies support efficient data storage, retrieval, updating, relationship management, and data integrity within the system [70].
The DBMS plays a central role in maintaining the relationship among users, documents, document participants, extracted insights, blockchain anchors, and verification logs. While blockchain stores only the document hash or integrity record, the DBMS manages the operational data required by the web application. This separation allows the system to maintain efficient document management while still supporting blockchain-based verification.
Figure 14. DBMS

Application Programming Interfaces (APIs)
Application Programming Interfaces (APIs) are used to enable communication among the different components of the LexChain system. In the proposed system, APIs and interfaces are used for specific functions rather than being treated as a general technology. The NLP/AI API is used for document summarization and analysis. It receives OCR-extracted text and returns structured outputs such as document summaries, involved parties, dates, obligations, and clauses [54]. The OCR processing interface connects the backend system to the selected OCR tool. Since Tesseract OCR is selected, the backend may call the OCR engine through command-line execution, backend scripts, or available programming wrappers [48]. The backend API handles system requests such as user authentication, document upload, permission checking, search, verification, retrieval, and audit logging. APIs are important in software architecture because they support modular communication and integration between system components [71].
Through these APIs and interfaces, LexChain ensures efficient data exchange among system modules while maintaining modularity, scalability, and maintainability. Proper API-based integration also supports future system expansion, including possible integration with additional OCR services, AI models, blockchain networks, or institutional systems.


Figure 15. APIs

System Testing and Implementation
System testing and implementation were conducted to ensure that the proposed LexChain system operates accurately, efficiently, and securely in a real-world environment. Various testing methods, including functional, integration, performance, and security testing, were performed to validate that all system features, such as user authentication, document upload, OCR text extraction, NLP-based summarization, blockchain anchoring, and document verification, function as intended and interact seamlessly. User Acceptance Testing (UAT) was also carried out to evaluate usability and gather feedback from potential users. Following successful testing, the system was implemented as a web-based platform deployed on a server environment with integrated database, OCR, NLP, and blockchain components. User roles and access controls were configured to ensure secure and organized system usage. Overall, the implementation confirms that the system supports a complete workflow from document submission to verification while maintaining performance, reliability, and data integrity.

System Maintenance
System maintenance ensures the continuous performance, reliability, and security of the proposed LexChain system after deployment. It involves regular monitoring of system operations, updating software components, and addressing any detected errors or vulnerabilities. Maintenance activities include improving system features, optimizing performance, and ensuring compatibility with updated technologies such as OCR, NLP models, and blockchain networks. Additionally, database maintenance and backup procedures are implemented to prevent data loss and ensure data integrity. User feedback is also considered to enhance system usability and functionality. Through ongoing maintenance, the system remains efficient, secure, and adaptable to future requirements and technological advancements.

System Security Plan
The System Security Plan outlines the security measures implemented in the LexChain system to protect data, ensure system integrity, and maintain confidentiality, availability, and reliability. The system adopts security controls aligned with ISO/IEC 27001 standards, focusing on access control, data protection, system monitoring, and risk management. These controls are designed to safeguard sensitive legal documents, user information, and blockchain verification processes against unauthorized access, data breaches, and system vulnerabilities.

Security Domain (ISO 27001)
Control Area
Description / Implementation in the System
Access Control
User Authentication and Authorization
The system implements secure login mechanisms with role-based access control (RBAC). Internal system roles are limited to User and Admin, while document-level access is controlled through explicit whitelist permissions. The Public Verifier is treated as an external actor for verification only.
Access Control
Least Privilege Principle
Users are granted only the minimum level of access required. Document access is controlled through whitelist-based permissions, ensuring the confidentiality of sensitive records.
Cryptography
Data Encryption and Hashing
The system uses cryptographic hashing algorithms to generate document hashes, which are anchored to the blockchain. This ensures data integrity and tamper detection.
Cryptography
Secure Data Transmission
Secure communication protocols (e.g., HTTPS) are used to protect data transmitted between users and the system.
Operations Security
Logging and Monitoring
The system records user activities, document processing events, and verification attempts in logs for monitoring and auditing purposes.
Operations Security
Backup and Recovery
Regular data backups are performed to prevent data loss. Recovery mechanisms are implemented to restore system data in case of failure.
System Acquisition, Development, and Maintenance
Secure Development Practices
The system is developed following secure coding standards and regular testing to identify and fix vulnerabilities.
System Acquisition, Development, and Maintenance
System Updates and Patching
Continuous updates are applied to improve system performance and address security vulnerabilities.
Information Security Incident Management
Incident Detection and Response
The system monitors unusual activities and logs potential security incidents, allowing administrators to respond promptly.
Information Security Incident Management
Verification Alerts
Alerts are generated when document verification results indicate mismatches or potential tampering.
Communications Security
Network Security
The system operates over secure networks with controlled access to prevent unauthorized interception of data.
Communications Security
API Security
APIs used for OCR, NLP, and blockchain integration are secured to prevent unauthorized access and data leakage.
Physical and Environmental Security
Server and Infrastructure Security
The system relies on secure hosting environments and cloud infrastructure to ensure physical protection of servers and data.
Compliance
Data Privacy and Protection
The system adheres to data privacy principles by limiting access to sensitive data and ensuring secure storage and processing of user information.


Table 8. System Security Plan

System Maintenance Plan
The System Maintenance Plan ensures the continuous operation, performance, and reliability of the LexChain system after deployment. It defines the activities required to maintain system quality based on ISO/IEC 25010 software quality attributes. These activities include monitoring system performance, updating system components, ensuring security, and improving usability. Regular maintenance allows the system to adapt to changing requirements, fix issues, and maintain optimal functionality over time.

ISO 25010 Attribute
Maintenance Activity
Description
Frequency
Performance Efficiency
System Performance Monitoring
Monitor system response time during document processing, OCR, NLP, and verification tasks to ensure optimal performance.
Weekly
Reliability
Error Detection and Fixing
Identify and resolve system errors, bugs, and failures to maintain stable operation.
As needed / Ongoing
Security
Security Updates and Patching
Apply security updates, fix vulnerabilities, and ensure protection against unauthorized access and threats.
Monthly / As needed
Usability
User Interface Improvements
Enhance system interface based on user feedback to improve ease of use and user experience.
Quarterly
Maintainability
Code Refactoring and Optimization
Improve system code structure for better readability, scalability, and easier future updates.
Quarterly
Compatibility
System Compatibility Updates
Ensure the system works properly across different devices, browsers, and environments.
Quarterly
Functional Suitability
Feature Enhancement
Add or improve system features such as document processing, search, and verification functionalities.
As needed
Availability
System Monitoring and Uptime Management
Monitor system availability and ensure minimal downtime through server and service checks.
Daily
Data Integrity
Database Maintenance and Backup
Perform database optimization, backups, and data recovery procedures to prevent data loss.
Weekly
Portability
System Environment Updates
Update system configurations to support deployment in different environments or platforms.
As needed


Table 9. System Maintenance Plan













References
[1] [1] World Bank, *World Development Report 2016: Digital Dividends*. Washington, DC, USA: World Bank, 2016.
[2] H. Kaur and V. Gupta, “A survey on document management systems,” *Int. J. Comput. Appl.*, vol. 120, no. 5, pp. 38–42, 2014.
[3] A. Al-Hawari, “The role of digital document management systems in improving organizational performance,” *Int. J. Inf. Manage.*, vol. 38, no. 1, pp. 10–18, 2018.
[4] McKinsey & Company, “Digital transformation in document processing,” 2021. [Online]. Available: https://www.mckinsey.com/
[5] R. Smith, “An overview of the Tesseract OCR engine,” in *Proc. Int. Conf. Document Analysis and Recognition (ICDAR)*, 2007, pp. 629–633.
[6] R. C. Gonzalez and R. E. Woods, *Digital Image Processing*, 4th ed. New York, NY, USA: Pearson, 2018.
[7] V. Gupta and G. S. Lehal, “A survey of text summarization techniques,” *J. Emerg. Technol. Web Intell.*, vol. 2, no. 3, pp. 258–268, 2010.
[8] D. Jurafsky and J. H. Martin, *Speech and Language Processing*, 3rd ed., draft, 2023. [Online]. Available: https://web.stanford.edu/~jurafsky/slp3/
[9] Z. Zheng *et al.*, “Blockchain challenges and opportunities: A survey,” *Int. J. Web Grid Serv.*, vol. 14, no. 4, pp. 352–375, 2018.
[10] S. Nakamoto, “Bitcoin: A peer-to-peer electronic cash system,” 2008. [Online]. Available: https://bitcoin.org/bitcoin.pdf
[11] M. Swan, *Blockchain: Blueprint for a New Economy*. Sebastopol, CA, USA: O’Reilly Media, 2015.
[12] ChainDoc, “Blockchain document verification system,” 2023. [Online]. Available: https://www.chaindoc.io/
[13] DocuFi, “Blockchain-based document verification platform,” 2023. [Online]. Available: https://www.docufi.io/
[14] CodeLegal, “Legal document automation and compliance platform,” 2023. [Online]. Available: https://www.codelegal.io/
[15] DocuSign, “DocuSign Intelligent Agreement Management (IAM),” 2024. [Online]. Available: https://www.docusign.com/
[16] Evisort, “AI-powered contract management platform,” 2024. [Online]. Available: https://www.evisort.com/
[17] ISO, “ISO 15489-1:2016 Information and documentation—Records management—Part 1: Concepts and principles,” Geneva, Switzerland, 2016. [Online]. Available: https://www.iso.org/standard/62542.html
[18] Deloitte, “Blockchain in legal systems,” 2020. [Online]. Available: https://www2.deloitte.com/
[19] Accenture, “Blockchain for document integrity,” 2021. [Online]. Available: https://www.accenture.com/
[20] J. Becker, M. Kugeler, and M. Rosemann, *Process Management: A Guide for the Design of Business Processes*. Berlin, Germany: Springer, 2013.
[21] United Nations, *The Sustainable Development Goals Report 2022*. New York, NY, USA: United Nations, 2022.
[22] IBM, “Blockchain for document verification,” 2022. [Online]. Available: https://www.ibm.com/
[23] K. Christidis and M. Devetsikiotis, “Blockchains and smart contracts for the Internet of Things,” *IEEE Access*, vol. 4, pp. 2292–2303, 2016.
[24] A. Dorri, S. S. Kanhere, and R. Jurdak, “Blockchain in Internet of Things: Challenges and solutions,” *IEEE Internet Things J.*, vol. 6, no. 5, pp. 8078–8091, 2019.
[25] S. Madakam, R. Ramaswamy, and S. Tripathi, “Internet of Things (IoT): A literature review,” *J. Comput. Commun.*, vol. 3, no. 5, pp. 164–173, 2015.
[26] A. M. Winkler, “Document management systems and their impact on organizational efficiency,” *Inf. Syst. Manage.*, vol. 34, no. 2, pp. 123–134, 2017.
[27] N. Otsu, “A threshold selection method from gray-level histograms,” *IEEE Trans. Syst., Man, Cybern.*, vol. 9, no. 1, pp. 62–66, 1979.
[28] J. Devlin *et al.*, “BERT: Pre-training of deep bidirectional transformers for language understanding,” in *Proc. NAACL-HLT*, 2019, pp. 4171–4186.
[29] A. Vaswani *et al.*, “Attention is all you need,” in *Proc. NeurIPS*, 2017, pp. 5998–6008.
[30] G. Wood, “Ethereum: A secure decentralised generalised transaction ledger,” Ethereum Yellow Paper, 2014. [Online]. Available: https://ethereum.github.io/yellowpaper/paper.pdf
[31] Int. Telecommun. Union (ITU), “Digital transformation in document systems,” 2021.
[32] European Commission, “eGovernment and digital document frameworks,” 2020.
[33] OECD, “Digital government and secure records management,” 2021.
[34] World Economic Forum, “Blockchain beyond cryptocurrency: Applications in governance,” 2020.

[35] P. Mell and T. Grance, “The NIST definition of cloud computing,” NIST Special Publication 800-145, 2011.
[36] B. Kitchenham, “Procedures for performing systematic reviews,” Keele Univ., Tech. Rep., 2004.
[37] R. C. Gonzalez and R. E. Woods, *Digital Image Processing*, 4th ed. New York, NY, USA: Pearson, 2018.
[38] D. Jurafsky and J. H. Martin, *Speech and Language Processing*, 3rd ed., 2023.
[39] Z. Zheng *et al.*, “Blockchain challenges and opportunities: A survey,” 2018.
[40] K. Christidis and M. Devetsikiotis, “Blockchain and smart contracts,” 2016.
[41] A. Dorri *et al.*, “Blockchain in Internet of Things,” 2019.
[42] R. Smith, “An overview of the Tesseract OCR engine,” in Proc. Int. Conf. Document Analysis and Recognition (ICDAR), 2007, pp. 629–633.
[43] D. Jurafsky and J. H. Martin, Speech and Language Processing, 3rd ed. (draft). Stanford University, 2023. [Online]. Available: https://web.stanford.edu/~jurafsky/slp3/
[44] Z. Zheng, S. Xie, H. Dai, X. Chen, and H. Wang, “Blockchain challenges and opportunities: A survey,” Int. J. Web Grid Serv., vol. 14, no. 4, pp. 352–375, 2018.
[45] A. Silberschatz, H. F. Korth, and S. Sudarshan, Database System Concepts, 7th ed. New York, NY, USA: McGraw-Hill, 2020.
[46] M. Richards and N. Ford, Fundamentals of Software Architecture: An Engineering Approach. Sebastopol, CA, USA: O’Reilly Media, 2020.
[47] Tesseract OCR, “Tesseract User Manual,” Tesseract OCR Documentation. [Online]. Available: https://tesseract-ocr.github.io/tessdoc/. [Accessed: May 24, 2026].
[48] Tesseract OCR, “Tesseract Open Source OCR Engine,” GitHub Repository. [Online]. Available: https://github.com/tesseract-ocr/tesseract. [Accessed: May 24, 2026].
[49] PaddlePaddle, “PaddleOCR Documentation,” PaddleOCR. [Online]. Available: https://www.paddleocr.ai/. [Accessed: May 24, 2026].
[50] PaddlePaddle, “PaddleOCR: Turn Any PDF or Image Document into Structured Data,” GitHub Repository. [Online]. Available: https://github.com/PaddlePaddle/PaddleOCR. [Accessed: May 24, 2026].
[51] Google Cloud, “Detect and Extract Text from Images,” Cloud Vision API Documentation. [Online]. Available: https://cloud.google.com/vision/docs/ocr. [Accessed: May 24, 2026].
[52] Google Cloud, “Cloud Vision API Client Libraries,” Google Cloud Documentation. [Online]. Available: https://cloud.google.com/vision/docs/libraries. [Accessed: May 24, 2026].
[53] spaCy, “Tokenizer,” spaCy API Documentation. [Online]. Available: https://spacy.io/api/tokenizer/. [Accessed: May 24, 2026].
[54] spaCy, “Linguistic Features,” spaCy Usage Documentation. [Online]. Available: https://spacy.io/usage/linguistic-features. [Accessed: May 24, 2026].
[55] Sentence Transformers, “Semantic Textual Similarity,” Sentence Transformers Documentation. [Online]. Available: https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html. [Accessed: May 24, 2026].
[56] N. Reimers and I. Gurevych, “Sentence-BERT: Sentence embeddings using Siamese BERT-networks,” in Proc. 2019 Conf. Empirical Methods in Natural Language Processing and 9th Int. Joint Conf. Natural Language Processing, Hong Kong, China, 2019, pp. 3982–3992.
[57] Hugging Face, “Sentence Transformers,” GitHub Repository. [Online]. Available: https://github.com/huggingface/sentence-transformers. [Accessed: May 24, 2026].
[58] Meta, “Llama 3.1 Model Card,” Meta Llama Models. [Online]. Available: https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md. [Accessed: May 24, 2026].
[59] Meta, “Llama-3.1-70B-Instruct,” Hugging Face. [Online]. Available: https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct. [Accessed: May 24, 2026].
[60] A. Vaswani et al., “Attention is all you need,” in Proc. Advances in Neural Information Processing Systems, Long Beach, CA, USA, 2017, pp. 5998–6008.
[61] S. Bird, E. Klein, and E. Loper, Natural Language Processing with Python. Sebastopol, CA, USA: O’Reilly Media, 2009.
[62] LangChain, “Text Splitters,” LangChain Documentation. [Online]. Available: https://python.langchain.com/docs/concepts/text_splitters/. [Accessed: May 24, 2026].
[63] G. Salton and C. Buckley, “Term-weighting approaches in automatic text retrieval,” Information Processing & Management, vol. 24, no. 5, pp. 513–523, 1988.
[64] OpenAI, “Embeddings,” OpenAI API Documentation. [Online]. Available: https://platform.openai.com/docs/guides/embeddings. [Accessed: May 24, 2026].
[65] P. Bojanowski, E. Grave, A. Joulin, and T. Mikolov, “Enriching word vectors with subword information,” Transactions of the Association for Computational Linguistics, vol. 5, pp. 135–146, 2017.
[66] Google AI for Developers, “Gemini API Documentation,” Google AI. [Online]. Available: https://ai.google.dev/gemini-api/docs. [Accessed: May 24, 2026].
[67] Google Cloud, “Cloud Natural Language Documentation,” Google Cloud Documentation. [Online]. Available: https://cloud.google.com/natural-language/docs. [Accessed: May 24, 2026].
[68] Base, “Base Documentation,” Base Docs. [Online]. Available: https://docs.base.org/get-started/base. [Accessed: May 24, 2026].
[69] Coinbase, “Introducing Base: Coinbase’s L2 Network,” Coinbase Help. [Online]. Available: https://help.coinbase.com/en/coinbase/other-topics/other/base. [Accessed: May 24, 2026].
[70] Ethereum Foundation, “Gas and Fees,” Ethereum.org Documentation. [Online]. Available: https://ethereum.org/developers/docs/gas/. [Accessed: May 24, 2026].
[71] G. Wood, “Ethereum: A secure decentralised generalised transaction ledger,” Ethereum Yellow Paper, 2014. [Online]. Available: https://ethereum.github.io/yellowpaper/paper.pdf. [Accessed: May 24, 2026].
[72] Polygon Labs, “Polygon PoS Documentation,” Polygon Documentation. [Online]. Available: https://docs.polygon.technology/pos/. [Accessed: May 24, 2026].
[73] Hyperledger Foundation, “Hyperledger Fabric Documentation,” Hyperledger Fabric Docs. [Online]. Available: https://hyperledger-fabric.readthedocs.io/. [Accessed: May 24, 2026].
[74] IPFS, “IPFS Documentation,” IPFS Docs. [Online]. Available: https://docs.ipfs.tech/. [Accessed: May 24, 2026].


