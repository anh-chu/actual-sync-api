const swaggerAutogen = require('swagger-autogen')()

const doc = {
    info: {
      title: 'Actual Budget RESTful API for Syncing'
    },
    host: 'localhost:5006',
    basePath: "/api"
  };

const outputFile = './src/swagger_output.json'
const endpointsFiles = ['./src/app-api.ts']

swaggerAutogen(outputFile, endpointsFiles, doc)
