
### Build Stage ###
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


### Production Stage ###
FROM nginx:alpine

# Copy build output to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose custom port
EXPOSE 3003

# Update Nginx config to serve on 3003
RUN sed -i 's/listen       80;/listen       3003;/' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
