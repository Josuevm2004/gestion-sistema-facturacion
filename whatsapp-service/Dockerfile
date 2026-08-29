FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Crear directorio para persistencia de sesion
RUN mkdir -p auth_info_baileys

EXPOSE 3001

CMD ["node", "server.js"]
