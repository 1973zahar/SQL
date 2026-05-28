FROM node:22-alpine AS base
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/integrations/package.json packages/integrations/package.json
RUN npm install

COPY . .
RUN npm run build --workspace @crm/api

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@crm/api"]
