FROM node:20-alpine
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm install --legacy-peer-deps --include=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
