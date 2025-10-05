FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose backend port
EXPOSE 5000

# Start backend server in development mode
CMD ["npm", "run", "dev"] 