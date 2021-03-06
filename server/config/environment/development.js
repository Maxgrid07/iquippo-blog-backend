'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://127.0.0.1/sreiglobaldb'
  },
  uploadPath: 'server/uploads/',
  templatePath: 'client/assets',
  contactNumber: "011 66025672",
  /*Dev server payment setup*/
  serverPath: "http://192.168.43.155:8100/",
  ccAvenueWorkingKey: "CC6D430E8604D39EA9EDCABADF26BE4B",

  /*Localhost server payment setup*/
  //serverPath: "http://localhost",
  //ccAvenueWorkingKey:"BCCD36E2D20659D5F76B99973880340D",

  seedDB: true,
  mailConfig: { MailHost: "smtp.gmail.com", MailPort: "465", Mailusername: "iquippo.uat@gmail.com", Mailpassword: "pass12345678", from: "iquippo.uat@gmail.com" },
  supportMail: "iquippo.uat@gmail.com",
  qpvalURL: "http://13.126.19.255/Valuers/api.php",
  REDIRECT_URL: "http://finance-uat.iquippo.com/customer-portal-iquippo/sso",
  MLP_REDIRECT_URL: "http://finance-uat.iquippo.com/customer-portal-mlp/sso",
  // awsEndpoint: 's3.ap-south-1.amazonaws.com',
  // awsAccessKeyId: 'AKIAIEW6UDFVW7GEQAGQ',
  // awsSecretAccessKey: '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',
  // awsBucket: 'iquippo-image-upload-dev',
  // awsUrl: 'https://s3.ap-south-1.amazonaws.com/',
  S3: {
    AWS_URL: 'https://s3.ap-south-1.amazonaws.com/',
    BUCKET: 'iquippo-image-upload-dev',
    PATH: 'assets/uploads/banner/',
    ACCESS_KEY_ID: 'AKIAIEW6UDFVW7GEQAGQ',
    SECRET_ACCESS_KEY: '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',
    ACL: 'public-read',
    CACHE_CONTROL: 'maxAge=600000',
    EXPIRES: new Date(Date.now() + 604800000).toISOString(),
    SIGNATURE_VERSION: 'v4'
  }
};
