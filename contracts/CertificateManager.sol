// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateManager {
    struct Institution {
        string name;
        bool isApproved;
        bool isActive;
        uint256 certificatesIssued;
    }

    struct Certificate {
        string certificateId;
        string studentName;
        string course;
        uint256 issueDate;
        address issuer;
        bool isValid;
    }

    // State variables
    mapping(address => Institution) public institutions;
    mapping(string => Certificate) public certificates;
    address public admin;
    uint256 public totalInstitutions;
    uint256 public totalCertificates;

    // Events
    event InstitutionRegistered(address indexed institution, string name);
    event InstitutionApproved(address indexed institution);
    event InstitutionRevoked(address indexed institution);
    event CertificateIssued(string indexed certificateId, address indexed issuer);
    event CertificateRevoked(string indexed certificateId);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyApprovedInstitution() {
        require(institutions[msg.sender].isApproved && institutions[msg.sender].isActive,
                "Only approved and active institutions can perform this action");
        _;
    }

    // Constructor
    constructor() {
        admin = msg.sender;
    }

    // Institution Management
    function registerInstitution(string memory _name) external {
        require(!institutions[msg.sender].isApproved, "Institution already registered");
        
        institutions[msg.sender] = Institution({
            name: _name,
            isApproved: false,
            isActive: false,
            certificatesIssued: 0
        });
        
        totalInstitutions++;
        emit InstitutionRegistered(msg.sender, _name);
    }

    function approveInstitution(address _institution) external onlyAdmin {
        require(institutions[_institution].isApproved == false, "Institution already approved");
        
        institutions[_institution].isApproved = true;
        institutions[_institution].isActive = true;
        
        emit InstitutionApproved(_institution);
    }

    function revokeInstitution(address _institution) external onlyAdmin {
        require(institutions[_institution].isApproved, "Institution not approved");
        
        institutions[_institution].isActive = false;
        
        emit InstitutionRevoked(_institution);
    }

    // Certificate Management
    function issueCertificate(
        string memory _certificateId,
        string memory _studentName,
        string memory _course,
        uint256 _issueDate
    ) external onlyApprovedInstitution {
        require(bytes(certificates[_certificateId].certificateId).length == 0, "Certificate ID already exists");
        
        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            studentName: _studentName,
            course: _course,
            issueDate: _issueDate,
            issuer: msg.sender,
            isValid: true
        });
        
        institutions[msg.sender].certificatesIssued++;
        totalCertificates++;
        
        emit CertificateIssued(_certificateId, msg.sender);
    }

    function verifyCertificate(string memory _certificateId) external view returns (bool) {
        Certificate memory cert = certificates[_certificateId];
        return cert.isValid && 
               bytes(cert.certificateId).length > 0 && 
               institutions[cert.issuer].isActive;
    }

    function revokeCertificate(string memory _certificateId) external onlyApprovedInstitution {
        require(bytes(certificates[_certificateId].certificateId).length > 0, "Certificate does not exist");
        require(certificates[_certificateId].issuer == msg.sender, "Only issuer can revoke certificate");
        
        certificates[_certificateId].isValid = false;
        
        emit CertificateRevoked(_certificateId);
    }

    // Getters
    function getInstitutionInfo(address _institution) external view returns (
        string memory name,
        bool isApproved,
        bool isActive,
        uint256 certificatesIssued
    ) {
        Institution memory inst = institutions[_institution];
        return (inst.name, inst.isApproved, inst.isActive, inst.certificatesIssued);
    }

    function getCertificateInfo(string memory _certificateId) external view returns (
        string memory studentName,
        string memory course,
        uint256 issueDate,
        address issuer,
        bool isValid
    ) {
        Certificate memory cert = certificates[_certificateId];
        return (cert.studentName, cert.course, cert.issueDate, cert.issuer, cert.isValid);
    }
} 