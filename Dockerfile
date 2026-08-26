FROM node:22.2.0-slim as BUILD_STAGE

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm build

# Pinned to the build stage's major. The runtime reuses node_modules built
# above, and native modules there are compiled against this Node version.
FROM node:22-alpine

WORKDIR /app

# Install pnpm in production stage
RUN npm install -g pnpm@8

# Chromium for the PDF route (/api/pdf/[variant]).
#
# puppeteer-core ships no browser of its own, which is what we want here: the
# image installs one from Alpine instead of downloading a second copy at build
# time. nss, freetype and harfbuzz are Chromium's runtime libraries.
#
# font-liberation is not decoration, and it must not be swapped for the more
# common ttf-freefont. The CV body uses Tailwind's font-serif, which resolves
# to the generic serif family, so it is drawn with a system font rather than
# one of the Inter faces served from /public. On macOS that generic lands on
# Times and embeds as ordinary TrueType. With ttf-freefont it lands on
# FreeSerif, which Chromium embeds as a Type 3 font — the same broken-text-
# layer failure the @media print block in globals.css exists to avoid.
# Liberation Serif embeds as TrueType and is metric-compatible with Times, so
# the container output matches what CMD+P produces on the desktop.
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

COPY --from=BUILD_STAGE /app/package.json ./package.json
COPY --from=BUILD_STAGE /app/node_modules ./node_modules
COPY --from=BUILD_STAGE /app/.next ./.next
COPY --from=BUILD_STAGE /app/public ./public

EXPOSE 3000

CMD ["pnpm", "start"]