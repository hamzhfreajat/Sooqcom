# Website (Next.js) for sooq-com.com. Data comes from the FastAPI backend.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL=https://sooq-com.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Read in the browser, so it has to be known when the site is built
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
# Search-engine ownership codes and the analytics id. All optional; pages built ahead of time need them here
ARG GOOGLE_SITE_VERIFICATION=
ENV GOOGLE_SITE_VERIFICATION=$GOOGLE_SITE_VERIFICATION
ARG BING_SITE_VERIFICATION=
ENV BING_SITE_VERIFICATION=$BING_SITE_VERIFICATION
ARG NEXT_PUBLIC_GA_ID=
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT=standalone
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Port 80, the one the previous site used, so the proxy settings stay as they were
ENV PORT=80
ENV HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 80
CMD ["node", "server.js"]
