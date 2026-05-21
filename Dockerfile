FROM node:lts AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS build
RUN npm install
COPY . .
RUN npm run build

FROM nginx AS prod
COPY --from=build /app/dist /usr/share/nginx/html
