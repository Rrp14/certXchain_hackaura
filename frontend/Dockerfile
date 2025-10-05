FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose frontend port
EXPOSE 3000

# Start frontend development server with host flag
CMD ["npm", "start", "--", "--host", "0.0.0.0"] 