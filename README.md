# CertXChain - Blockchain-based Certificate Management System

A decentralized platform for issuing and verifying educational certificates using blockchain technology.

## Features

### Institution Features
- Institution Registration and Authentication
- Certificate Issuance with Blockchain Integration
- Custom Certificate Templates
- Certificate History Management
- Profile Management
- Password Reset Functionality

### Admin Features
- Institution Approval System
- Access Control Management
- Institution Status Management
- Admin Dashboard

### Student Features
- Certificate Verification
- Email Notifications
- Certificate Status Checking

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Web3.js
- JWT Authentication
- Nodemailer

### Frontend
- React.js
- Firebase Authentication
- Web3.js
- Material-UI

### Blockchain
- Ethereum (Sepolia Testnet)
- Smart Contracts
- IPFS (for certificate storage)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/certxchain.git
cd certxchain
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
- Create `.env` file in the backend directory
- Add the following variables:
  ```
  PORT=5000
  MONGODB_URI=your_mongodb_uri
  JWT_SECRET=your_jwt_secret
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=your_admin_password
  CONTRACT_ADDRESS=your_contract_address
  PRIVATE_KEY=your_private_key
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your_email
  EMAIL_PASS=your_email_password
  INFURA_URL=your_infura_url
  ```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd ../frontend
npm start
```

## Smart Contract

The smart contract handles:
- Institution registration and approval
- Certificate issuance and verification
- Access control management

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Blockchain-based verification
- Secure email communication

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 