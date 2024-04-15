FROM node:16

WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app
COPY package*.json /usr/src/app/

ARG environment=staging

#ENV NODE_OPTIONS=--max_old_space_size=3072
ENV NODE_OPTIONS=--max_old_space_size=6144

RUN npm install -g typescript@4.7.4
RUN npm install

COPY . /usr/src/app
RUN npm run build
EXPOSE 8000

COPY ./entrypoint.sh /usr/src/app/script.sh
CMD ["sh", "/usr/src/app/script.sh"]