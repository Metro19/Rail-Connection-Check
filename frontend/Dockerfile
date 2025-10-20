FROM node as vite-app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine3.21-perl as prod

COPY --from=vite-app /dist /usr/share/nginx/html
COPY ./nginx/nginx.conf  /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]