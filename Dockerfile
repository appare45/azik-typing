FROM node:lts AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS build-deps
RUN npm install --omit=dev

FROM build-deps AS build
COPY . .
RUN npm run build

FROM nginx AS prod
COPY --from=build /app/dist /usr/share/nginx/html
