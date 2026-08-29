FROM node:20-alpine

WORKDIR /app

# Instalar git y utilidades requeridas por dependencias en Alpine Linux
RUN apk add --no-cache git python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Directorio persistente para la sesion de WhatsApp
RUN mkdir -p auth_info_baileys

EXPOSE 3001

CMD ["node", "server.js"]
