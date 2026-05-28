FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar configuración de dependencias
COPY package*.json ./

# Instalar dependencias exactas
RUN npm ci

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 4000

# Comando de ejecución
CMD ["node", "server.js"]
