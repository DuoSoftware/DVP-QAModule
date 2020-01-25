#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-QAModule.git /usr/local/src/qamodule
#RUN cd /usr/local/src/qamodule; npm install
#CMD ["nodejs", "/usr/local/src/qamodule/app.js"]

#EXPOSE 8884

# FROM node:9.9.0
# ARG VERSION_TAG
# RUN git clone -b $VERSION_TAG https://github.com/DuoSoftware/DVP-QAModule.git /usr/local/src/qamodule
# RUN cd /usr/local/src/qamodule;
# WORKDIR /usr/local/src/qamodule
# RUN npm install
# EXPOSE 8884
# CMD [ "node", "/usr/local/src/qamodule/app.js" ]


FROM node:10-alpine
WORKDIR /usr/local/src/qamodule
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8884
CMD [ "node", "app.js" ]