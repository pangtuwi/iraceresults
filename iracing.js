//https://www.postman.com/rankupgamers/workspace/iracing-new-api/documentation/17959439-4e05a913-9b96-4acc-8ccb-6e0ff09a81c0

//External file requirements
const axios = require('axios');

//axios setup
const BASE_URL = 'https://members-ng.iracing.com/';
const TIMEOUT = 2000;

const axiosInstance = axios.create({
   baseURL: BASE_URL,
   timeout: TIMEOUT,
});

//Season Variables
let seasonSessions = [];

//Function to login to iRacing (note password determined elsewhere)
async function authUser() {
   var password = "pdhn!10iRacing";
   var username = "pangtuwi@gmail.com";
   const res = await axiosInstance.post('/auth', {
      email: 'pangtuwi@gmail.com',
      password: 'tVIAVW3xGUvWyrBu03jVVtM7FxLobilJe9UqzAw+cv4='
   });
   return res.headers['set-cookie'];
}

async function getSubsessionLink(id, cookie) {
   const res = await axiosInstance.get(`/data/results/get?subsession_id=${id}`, {
      headers: {
         cookie,
      },
   });
   return res.data;
} //getSubsession


async function getiRacingData(link) {
   const res = await axiosInstance.get(link);
   return res.data;
}

async function getDriverLink(id, cookie) {
   const res = await axiosInstance.get(`/data/member/get?cust_ids=${id}`, {
      headers: {
         cookie,
      },
   });
   return res.data;
} //getSubsession

async function getDriverData(cust_id, callback) {
   try {
      const cookie = await authUser();
      const iRacingLink = await getDriverLink(cust_id, cookie);
      const obj = await getiRacingData(iRacingLink.link);
      callback(null, obj);
   } catch (e) {
      console.error(e);
      callback (e, null);
   }
} //getDriverData

async function getSubsessionData(subsession_id) {
   try {
      const cookie = await authUser();
      const iRacingLink = await getSubsessionLink(subsession_id, cookie);
      const obj = await getiRacingData(iRacingLink.link);
   } catch (e) {
      console.error(e);
   }
} //getSubSessionData

exports.getDriverData = getDriverData;
exports.getSubsessionData = getSubsessionData;
