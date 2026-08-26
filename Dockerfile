# Both stages are Alpine on purpose.
#
# The runtime reuses node_modules compiled in the build stage. That only works
# if both stages share a libc: a native module built against glibc (node:slim)
# will not load on musl (node:alpine). It was survivable while every dependency
# was pure JavaScript; better-sqlite3 is not, so the stages are aligned here.
FROM node:22-alpine AS build

WORKDIR /app

# Toolchain for better-sqlite3's native build. Build stage only — none of it is
# copied into the runtime image.
RUN apk add --no-cache python3 make g++

RUN npm install -g pnpm@10.7.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm build

FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@10.7.0

# Chromium for the PDF route.
#
# puppeteer-core ships no browser of its own, which is what we want here: the
# image installs one from Alpine instead of downloading a second copy at build
# time. nss, freetype and harfbuzz are Chromium's runtime libraries.
#
# font-liberation is not decoration, and it must not be swapped for the more
# common ttf-freefont. The CV body uses Tailwind's font-serif; if the bundled
# Source Serif ever fails to load, the fallback is a system serif. Liberation
# Serif embeds as ordinary TrueType, while FreeSerif embeds as a Type 3 font —
# the broken-text-layer failure the @media print block in globals.css exists to
# avoid.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      font-liberation

# Read by src/lib/pdf/browser.ts. Alpine has moved this binary between
# releases, so setting it beats relying on the path search.
ENV CHROME_PATH=/usr/bin/chromium-browser

# Where the SQLite file lives. deploy.yml mounts a named volume here so the
# data survives deploys; the image itself carries no data.
ENV DATABASE_PATH=/data/cv.db

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["pnpm", "start"]
