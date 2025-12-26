import Vue from "vue"
import App from "./App.vue"
import vuetify from "./plugins/vuetify"
import firebase from "firebase"
import VueTextareaAutosize from "vue-textarea-autosize"

Vue.use(VueTextareaAutosize)

Vue.config.productionTip = false

firebase.initializeApp({
  apiKey: "AIzaSyCu48QHyiJG9UOnda0iQsanH_WjMwy4NpI",
  authDomain: "vue-calendar-8da9d.firebaseapp.com",
  projectId: "vue-calendar-8da9d",
  storageBucket: "vue-calendar-8da9d.appspot.com",
  messagingSenderId: "81956106791",
  appId: "1:81956106791:web:23936d227eaa0e6b2a5402",
})

export const db = firebase.firestore()

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app")
