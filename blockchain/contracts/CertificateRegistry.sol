// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateRegistry is Ownable {
    struct Certificate {
        string certificateId;
        string studentName;
        string studentEmail;
        string course;
        uint256 date;
        string institution;
        bool isValid;
    }

    mapping(string => Certificate) public certificates;
    mapping(address => bool) public authorizedInstitutions;

    event CertificateIssued(
        string certificateId,
        string studentName,
        string studentEmail,
        string course,
        uint256 date,
        string institution
    );

    event InstitutionAuthorized(address institution);
    event InstitutionRevoked(address institution);

    modifier onlyAuthorized() {
        require(authorizedInstitutions[msg.sender], "Not authorized");
        _;
    }

    function authorizeInstitution(address institution) external onlyOwner {
        authorizedInstitutions[institution] = true;
        emit InstitutionAuthorized(institution);
    }

    function revokeInstitution(address institution) external onlyOwner {
        authorizedInstitutions[institution] = false;
        emit InstitutionRevoked(institution);
    }

    function issueCertificate(
        string memory certificateId,
        string memory studentName,
        string memory studentEmail,
        string memory course,
        string memory institution
    ) external onlyAuthorized {
        require(bytes(certificates[certificateId].certificateId).length == 0, "Certificate ID already exists");
        
        certificates[certificateId] = Certificate({
            certificateId: certificateId,
            studentName: studentName,
            studentEmail: studentEmail,
            course: course,
            date: block.timestamp,
            institution: institution,
            isValid: true
        });

        emit CertificateIssued(
            certificateId,
            studentName,
            studentEmail,
            course,
            block.timestamp,
            institution
        );
    }

    function verifyCertificate(string memory certificateId) external view returns (bool) {
        return certificates[certificateId].isValid;
    }

    function getCertificate(string memory certificateId) external view returns (
        string memory studentName,
        string memory studentEmail,
        string memory course,
        uint256 date,
        string memory institution,
        bool isValid
    ) {
        Certificate memory cert = certificates[certificateId];
        return (
            cert.studentName,
            cert.studentEmail,
            cert.course,
            cert.date,
            cert.institution,
            cert.isValid
        );
    }
} 