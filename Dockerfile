FROM node:18-alpine3.14

WORKDIR /app
COPY package.json package-lock.json ./
# Install python deps
RUN apk add --update --no-cache \
    python3 \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

# Install node deps
RUN npm ci

# Run build script if one exists
RUN npm run build --if-present

# Copy the node_modules from above onto a `slim` image
FROM node:18-alpine3.14

WORKDIR /app
COPY --from=0 /app .
COPY ./tsconfig.json ./tsconfig.json
COPY ./src ./src

# Run the app
CMD node --loader ts-node/esm/transpile-only ./src/main.ts